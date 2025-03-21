// src/app/api/ticket/places-restantes/route.js
import { NextResponse } from "next/server";
import Ticket from "../../../../../server/models/ticket";
import mongoose from "mongoose";

// Assurez-vous que MongoDB est connecté
const connectMongoDB = async () => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("✅ MongoDB connecté depuis l'API places-restantes");
    } catch (error) {
      console.error("❌ Erreur de connexion MongoDB:", error);
      throw new Error("Erreur de connexion à la base de données");
    }
  }
};

export async function GET() {
  try {
    console.log("🔍 API /api/ticket/places-restantes appelée");
    
    // Se connecter à MongoDB
    await connectMongoDB();

    // Définir le nombre total de places par catégorie
    const TOTAL_PLACES = {
      earlyBird: 30,
      secondRelease: 60,
      thirdRelease: 160,
    };

    // Compter les tickets vendus par catégorie
    const earlyBirdSold = await Ticket.countDocuments({ category: "earlyBird" });
    const secondReleaseSold = await Ticket.countDocuments({ category: "secondRelease" });
    const thirdReleaseSold = await Ticket.countDocuments({ category: "thirdRelease" });

    // Calculer les places restantes
    const placesRestantes = {
      earlyBird: Math.max(0, TOTAL_PLACES.earlyBird - earlyBirdSold),
      secondRelease: Math.max(0, TOTAL_PLACES.secondRelease - secondReleaseSold),
      thirdRelease: Math.max(0, TOTAL_PLACES.thirdRelease - thirdReleaseSold),
    };

    console.log("✅ Places restantes calculées:", placesRestantes);
    return NextResponse.json(placesRestantes);
  } catch (error) {
    console.error("❌ Erreur API places-restantes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des places restantes" },
      { status: 500 }
    );
  }
}