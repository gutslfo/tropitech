import { NextResponse } from "next/server";
import { generateTicketPDF } from "../../../../../server/utils/generateTicket";
import fs from "fs";

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

        // Générer le billet PDF
        const filePath = await generateTicketPDF("Jean", "Dupont", "email@exemple.com", paymentId);

        console.log("✅ PDF généré :", filePath);

        // Lire le fichier PDF et l'envoyer
        const fileBuffer = fs.readFileSync(filePath);

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename=ticket_${paymentId}.pdf`
            }
        });

    } catch (error) {
        console.error("❌ ERREUR:", error);
        return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
    }
}
