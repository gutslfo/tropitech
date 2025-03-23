"use client"; // Important pour Next.js App Router

import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import dynamic from 'next/dynamic';

// Utiliser dynamic import pour éviter les problèmes SSR
const CheckoutForm = dynamic(() => import('@/components/ui/CheckoutForm'), {
  ssr: false,
  loading: () => <p>Chargement du formulaire de paiement...</p>
});

export default function PaymentPage() {
    const [stripePromise, setStripePromise] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // 🔹 Vérifier que la clé Stripe publique est bien chargée
        const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!stripeKey) {
            console.error("❌ ERREUR : Clé Stripe publique non définie !");
            setError("Configuration Stripe incomplète. Veuillez contacter l'administrateur.");
            setIsLoading(false);
        } else {
            try {
                setStripePromise(loadStripe(stripeKey));
                console.log("✅ Clé publique Stripe chargée");
                setIsLoading(false);
            } catch (err) {
                console.error("❌ Erreur lors de l'initialisation de Stripe:", err);
                setError("Erreur lors de l'initialisation du système de paiement.");
                setIsLoading(false);
            }
        }
    }, []);

    // Options Stripe - elles seront utilisées par CheckoutForm
    const options = {
        paymentMethodOrder: ["twint", "card"], // 🔥 Met Twint en premier
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Paiement</h1>
                <div className="text-center p-8">
                    <p className="mb-4">Initialisation du système de paiement...</p>
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Paiement</h1>
                <div className="bg-red-800/20 border border-red-800/50 p-4 rounded-lg text-center">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                    <a href="/" className="text-blue-500 underline mt-4 inline-block">Retour à l'accueil</a>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Paiement</h1>
            {stripePromise ? (
                <Elements stripe={stripePromise} options={options}>
                    <CheckoutForm />
                </Elements>
            ) : (
                <p>Chargement du paiement...</p>
            )}
        </div>
    );
}