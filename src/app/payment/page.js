"use client"; // Important pour Next.js App Router

import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "@/components/ui/CheckoutForm";

export default function PaymentPage() {
    const [clientSecret, setClientSecret] = useState("");
    const [stripePromise, setStripePromise] = useState(null);

    useEffect(() => {
        // 🔹 Vérifier que la clé Stripe publique est bien chargée
        const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!stripeKey) {
            console.error("❌ ERREUR : Clé Stripe publique non définie !");
        } else {
            setStripePromise(loadStripe(stripeKey));
            console.log("✅ Clé publique Stripe chargée :", stripeKey);
        }

        // 🔹 Demander un PaymentIntent avec Twint activé
        fetch("/api/payment/create-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: 1000, // 10 CHF en centimes
                email: "client@test.com",
                name: "Dupont",
                firstName: "Jean"
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log("✅ Client Secret reçu :", data.clientSecret);
            console.log("✅ Méthodes de paiement disponibles :", data.payment_method_types);
            setClientSecret(data.clientSecret);
        })
        .catch(error => console.error("❌ Erreur API PaymentIntent :", error));
    }, []);

    // 🔹 Forcer l'affichage de Twint avant la carte bancaire
    const options = {
        clientSecret,
        paymentMethodOrder: ["twint", "card"], // 🔥 Met Twint en premier
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Paiement</h1>
            {clientSecret && stripePromise ? (
                <Elements stripe={stripePromise} options={options}>
                    <CheckoutForm />
                </Elements>
            ) : (
                <p>Chargement du paiement...</p>
            )}
        </div>
    );
}

