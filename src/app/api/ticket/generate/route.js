import { NextResponse } from "next/server";
import { generateTicketPDF, sendTicketEmail } from "../../../../../server/utils/emailService";
import User from "../../../../../server/models/User";
import Ticket from "../../../../../server/models/ticket";

export async function GET(req) {
    console.log("🔥 API `/api/ticket/generate` appelée !");

    try {
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
        
        if (existingTicket) {
            category = existingTicket.category;
            console.log(`ℹ️ Ticket existant trouvé avec la catégorie: ${category}`);
        } else {
            // Déterminer la catégorie basée sur le nombre de tickets vendus
            // On pourrait implémenter une logique plus sophistiquée ici
            const ticketCount = await Ticket.countDocuments();
            
            if (ticketCount < 30) {
                category = "earlyBird";
            } else if (ticketCount < 90) { // 30 + 60
                category = "secondRelease";
            }
            
            console.log(`ℹ️ Nouvelle catégorie attribuée: ${category}`);
        }

        // Générer le billet PDF
        const { filePath, qrCodePath, qrCodeURL } = await generateTicketPDF(
            user.name,
            user.firstName,
            user.email,
            paymentId,
            category
        );

        console.log("✅ PDF généré :", filePath);
        
        // Si le ticket n'existe pas encore, le créer maintenant
        if (!existingTicket) {
            const newTicket = new Ticket({
                paymentId, 
                email: user.email,
                name: user.name,
                firstName: user.firstName,
                category,
                imageConsent: user.imageConsent
            });
            await newTicket.save();
            console.log("✅ Nouveau ticket enregistré en base de données");
            
            // Envoyer l'email avec le billet
            await sendTicketEmail(user.email, user.name, user.firstName, { filePath, qrCodePath, qrCodeURL });
        }

        // Lire le fichier PDF et l'envoyer
        const fileBuffer = fs.readFileSync(filePath);

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename=ticket_${user.name}_${user.firstName}.pdf`
            }
        });

    } catch (error) {
        console.error("❌ ERREUR:", error);
        return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
    }
}