// src/app/api/ticket/places-restantes/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// Définir le nombre total de places par catégorie
const TOTAL_PLACES = {
  earlyBird: 30,
  secondRelease: 60,
  thirdRelease: 160,
};

// Modèles avec chargement dynamique pour éviter les problèmes de chemin
let Ticket;

// Connecter à MongoDB de manière sécurisée
const connectMongoDB = async () => {
  if (mongoose.connection.readyState !== 1) {
    try {
      if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not defined in environment variables");
      }
      
      await mongoose.connect(process.env.MONGO_URI);
      console.log("✅ MongoDB connecté depuis l'API places-restantes");
      
      // Importer dynamiquement les modèles après la connexion
      try {
        const TicketModel = await import("../../../../../server/models/ticket");
        Ticket = TicketModel.default;
        console.log("✅ Modèle Ticket chargé avec succès");
      } catch (error) {
        console.error("❌ Erreur de chargement du modèle Ticket:", error);
        throw error;
      }
    } catch (error) {
      console.error("❌ Erreur de connexion MongoDB:", error);
      throw new Error("Erreur de connexion à la base de données");
    }
  } else if (!Ticket) {
    // Si déjà connecté mais modèles pas encore chargés
    try {
      const TicketModel = await import("../../../../../server/models/ticket");
      Ticket = TicketModel.default;
      console.log("✅ Modèle Ticket chargé avec succès");
    } catch (error) {
      console.error("❌ Erreur de chargement du modèle Ticket:", error);
      throw error;
    }
  }
};

// Implémentation de mise en cache des résultats pour réduire les requêtes DB
let cachedData = null;
let cacheTime = 0;
const CACHE_TTL = 60000; // 1 minute en millisecondes

export async function GET() {
  try {
    console.log("🔍 API /api/ticket/places-restantes appelée");
    
    // Vérifier si on a des données en cache valides
    const now = Date.now();
    if (cachedData && (now - cacheTime < CACHE_TTL)) {
      console.log("✅ Utilisation du cache pour les places restantes");
      return NextResponse.json(cachedData);
    }
    
    // Se connecter à MongoDB et charger les modèles
    await connectMongoDB();

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
    
    // Mettre à jour le cache
    cachedData = placesRestantes;
    cacheTime = now;
    
    return NextResponse.json(placesRestantes);
  } catch (error) {
    console.error("❌ Erreur API places-restantes:", error);
    return NextResponse.json(
      { 
        error: "Erreur lors de la récupération des places restantes",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}