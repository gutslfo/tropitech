// src/app/api/payment/create-payment/route.js
import Stripe from "stripe";
import { NextResponse } from 'next/server';

// Initialisation de Stripe avec gestion d'erreur
let stripe;
try {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY n'est pas défini dans les variables d'environnement");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} catch (error) {
    console.error("❌ Erreur d'initialisation de Stripe:", error);
    // Ne pas faire échouer le démarrage du serveur, mais l'API ne fonctionnera pas
}

export async function POST(req) {
    try {
        // Vérifier que Stripe est initialisé
        if (!stripe) {
            return NextResponse.json(
                { error: "Le service de paiement n'est pas disponible" },
                { status: 503 }
            );
        }

        // Vérifier que le body est présent
        if (!req) {
            return NextResponse.json(
                { error: "Requête invalide" },
                { status: 400 }
            );
        }

        let body;
        try {
            body = await req.json();
        } catch (parseError) {
            console.error("❌ Erreur parsing JSON de la requête:", parseError);
            return NextResponse.json(
                { error: "Format de requête invalide", details: "Le corps de la requête n'est pas un JSON valide" },
                { status: 400 }
            );
        }

        console.log("✅ Demande de paiement reçue :", body);

        // Validation basique
        if (!body.amount || !body.email || !body.name || !body.firstName) {
            return NextResponse.json(
                { error: "Données manquantes", details: "Les champs amount, email, name et firstName sont requis" },
                { status: 400 }
            );
        }

        // Validation supplémentaire
        if (isNaN(body.amount) || body.amount <= 0) {
            return NextResponse.json(
                { error: "Montant invalide", details: "Le montant doit être un nombre positif" },
                { status: 400 }
            );
        }

        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: body.amount,
                currency: "chf",
                payment_method_types: ["card", "twint"],
                receipt_email: body.email,
                metadata: {
                    customer_name: body.name,
                    customer_firstName: body.firstName,
                    customer_email: body.email
                }
            });
            
            // Journalisation pour le debugging
            console.log("✅ PaymentIntent créé avec succès:", paymentIntent.id);
            console.log("✅ Client Secret généré:", paymentIntent.client_secret ? "Oui" : "Non");
            
            // Vérifier que le client_secret est présent
            if (!paymentIntent.client_secret) {
                throw new Error("Impossible d'obtenir un client_secret de Stripe");
            }

            return NextResponse.json({
                clientSecret: paymentIntent.client_secret,
                payment_method_types: paymentIntent.payment_method_types,
                id: paymentIntent.id // Ajouter l'ID pour debugging
            }, {
                headers: { "Content-Type": "application/json" },
                status: 200
            });
        } catch (stripeError) {
            console.error("❌ Erreur Stripe:", stripeError);
            
            // Gestion spécifique des erreurs Stripe
            if (stripeError.type === 'StripeCardError') {
                return NextResponse.json({ error: "Erreur de carte bancaire", details: stripeError.message }, { status: 400 });
            } else if (stripeError.type === 'StripeRateLimitError') {
                return NextResponse.json({ error: "Trop de requêtes", details: "Veuillez réessayer dans quelques instants" }, { status: 429 });
            } else if (stripeError.type === 'StripeInvalidRequestError') {
                return NextResponse.json({ error: "Requête Stripe invalide", details: stripeError.message }, { status: 400 });
            }
            
            // Erreur générique Stripe
            return NextResponse.json({ 
                error: "Erreur lors du paiement", 
                details: stripeError.message 
            }, { status: 500 });
        }
    } catch (error) {
        console.error("❌ Erreur globale:", error);
        return NextResponse.json({ 
            error: "Erreur interne du serveur", 
            details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        }, { status: 500 });
    }
}