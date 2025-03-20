import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    try {
        const body = await req.json();
        console.log("✅ Demande de paiement reçue :", body);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: body.amount,
            currency: "chf",
            payment_method_types: ["card", "twint"],
            receipt_email: body.email
        });
        
        return new Response(JSON.stringify({
            clientSecret: paymentIntent.client_secret,
            payment_method_types: paymentIntent.payment_method_types // ✅ On affiche les moyens de paiement
        }), {
            headers: { "Content-Type": "application/json" },
            status: 200
        });

    } catch (error) {
        console.error("❌ Erreur Stripe :", error);
        return new Response(JSON.stringify({ error: "Erreur lors du paiement" }), {
            headers: { "Content-Type": "application/json" },
            status: 500
        });
    }
}
