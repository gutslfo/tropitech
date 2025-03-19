"use client"; // Important pour Next.js App Router

import { useEffect, useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";

export default function CheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (stripe) {
            console.log("✅ Stripe est bien chargé, voici les méthodes disponibles :", stripe);
        } else {
            console.error("❌ Erreur : Stripe ne s'est pas chargé correctement !");
        }
    }, [stripe]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setIsLoading(true);
        setErrorMessage("");

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: "http://localhost:3000/success" }
        });

        if (error) {
            console.error("❌ Erreur de paiement :", error.message);
            setErrorMessage(error.message);
        } else {
            console.log("✅ Paiement réussi !");
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Paiement sécurisé</h2>
            
            {/* Affiche les moyens de paiement */}
            <PaymentElement />
            
            <button 
                type="submit" 
                disabled={!stripe || isLoading}
                className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg"
            >
                {isLoading ? "Paiement en cours..." : "Payer"}
            </button>

            {/* Affichage des erreurs */}
            {errorMessage && <p className="mt-2 text-red-600">{errorMessage}</p>}
        </form>
    );
}
