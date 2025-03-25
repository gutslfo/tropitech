// src/app/api/ticket/generate/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Import models with correct paths
// Corrected paths and imports for server models
let User, Ticket, generateTicketPDF, sendTicketEmail, hasEmailBeenSent;

// Initialize mongoose models dynamically to avoid direct import path issues
const initModels = async () => {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        try {
            if (!process.env.MONGO_URI) {
                throw new Error("MONGO_URI is not defined in environment variables");
            }
            await mongoose.connect(process.env.MONGO_URI);
            console.log("✅ Connected to MongoDB from ticket/generate API");
        } catch (error) {
            console.error("❌ MongoDB connection error:", error);
            throw error;
        }
    }

    // Import models dynamically - this avoids path issues
    try {
        // Dynamic imports have better compatibility with Next.js production builds
        const UserModel = await import("../../../../../server/models/User");
        const TicketModel = await import("../../../../../server/models/ticket");
        const TicketUtils = await import("../../../../../server/utils/generateTicket");
        const EmailUtils = await import("../../../../../server/utils/emailService");
        
        User = UserModel.default;
        Ticket = TicketModel.default;
        generateTicketPDF = TicketUtils.generateTicketPDF;
        sendTicketEmail = EmailUtils.sendTicketEmail;
        hasEmailBeenSent = EmailUtils.hasEmailBeenSent;

        console.log("✅ Models and utilities loaded successfully");
    } catch (error) {
        console.error("❌ Error loading models or utilities:", error);
        throw error;
    }
};

export async function GET(req) {
    console.log("🔥 API `/api/ticket/generate` appelée !");

    try {
        // Initialize models first
        await initModels();

        // Vérification si Next.js capte bien la requête
        if (!req.url) {
            console.log("❌ ERREUR: `req.url` est vide !");
            return NextResponse.json({ error: "Problème de requête" }, { status: 500 });
        }

        // 📌 Extraire `paymentId` depuis l'URL
        const searchParams = new URL(req.url).searchParams;
        const paymentId = searchParams.get("paymentId");

        console.log("🔍 Payment ID reçu :", paymentId);

        if (!paymentId) {
            return NextResponse.json({ error: "ID de paiement requis" }, { status: 400 });
        }

        // Récupérer les informations utilisateur depuis la base de données
        const user = await User.findOne({ paymentId });
        
        if (!user) {
            console.log(`❌ Aucun utilisateur trouvé avec paymentId: ${paymentId}`);
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
        }
        
        // Vérifier si un ticket existe déjà
        const existingTicket = await Ticket.findOne({ paymentId });
        let category = "thirdRelease"; // Catégorie par défaut
        let ticketData;
        
        if (existingTicket) {
            category = existingTicket.category;
            console.log(`ℹ️ Ticket existant trouvé avec la catégorie: ${category}`);
            
            // IMPORTANT: Utiliser le PDF existant s'il est disponible
            if (existingTicket.pdfPath && fs.existsSync(existingTicket.pdfPath)) {
                console.log(`✅ Utilisation du PDF existant: ${existingTicket.pdfPath}`);
                ticketData = {
                    filePath: existingTicket.pdfPath,
                    qrCodePath: '', // Non utilisé ici
                    qrData: `https://tropitech.ch/ticket/${paymentId}`
                };
            } else {
                // Générer un nouveau PDF si nécessaire
                ticketData = await generateTicketPDF(
                    user.name,
                    user.firstName,
                    user.email,
                    paymentId,
                    category
                );
                
                // Mettre à jour le ticket avec le chemin du PDF
                await Ticket.findByIdAndUpdate(existingTicket._id, {
                    pdfPath: ticketData.filePath
                });
            }
            
            // IMPORTANT: NE PAS RE-ENVOYER L'EMAIL ICI
            // C'est déjà fait par le webhook Stripe
            console.log(`⚠️ Email non ré-envoyé pour éviter les doublons`);
        } else {
            // Si le ticket n'existe pas encore (cas rare, car le webhook devrait l'avoir créé)
            console.log(`⚠️ Aucun ticket existant pour ${paymentId} - Création d'un nouveau ticket`);
            
            // Déterminer la catégorie basée sur le nombre de tickets vendus
            const ticketCount = await Ticket.countDocuments();
            
            if (ticketCount < 30) {
                category = "earlyBird";
            } else if (ticketCount < 90) { // 30 + 60
                category = "secondRelease";
            }
            
            console.log(`ℹ️ Nouvelle catégorie attribuée: ${category}`);
            
            // Générer le billet PDF
            ticketData = await generateTicketPDF(
                user.name,
                user.firstName,
                user.email,
                paymentId,
                category
            );

            // Créer un nouveau ticket en BDD
            const newTicket = new Ticket({
                paymentId, 
                email: user.email,
                name: user.name,
                firstName: user.firstName,
                category,
                imageConsent: user.imageConsent,
                pdfPath: ticketData.filePath,
                emailSent: false // Par défaut
            });
            
            await newTicket.save();
            console.log("✅ Nouveau ticket enregistré en base de données");
            
            // IMPORTANT: NE PAS ENVOYER D'EMAIL ICI
            // Laisser le webhook Stripe s'en charger ou rendre l'envoi explicite
            console.log("⚠️ Email non envoyé depuis la route generate pour éviter les doublons");
        }

        // Lire le fichier PDF et l'envoyer
        const fileBuffer = fs.readFileSync(ticketData.filePath);

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename=ticket_${user.name}_${user.firstName}.pdf`
            }
        });

    } catch (error) {
        console.error("❌ ERREUR:", error);
        return NextResponse.json({ 
            error: "Erreur interne du serveur", 
            details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        }, { status: 500 });
    }
}