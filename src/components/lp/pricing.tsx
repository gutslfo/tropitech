import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "../ui/button";
import Link from "next/link";

interface TicketData {
  total: number;
  remaining: number;
  price: number;
}

interface TicketsData {
  earlyBird: TicketData;
  secondRelease: TicketData;
  thirdRelease: TicketData;
}

interface PricingCardProps {
  initialTicketsData?: TicketsData;
}

export default function PricingCard({ initialTicketsData }: PricingCardProps) {
  const [ticketsData, setTicketsData] = useState<TicketsData>(
    initialTicketsData || {
      earlyBird: { total: 30, remaining: 0, price: 10 },
      secondRelease: { total: 60, remaining: 0, price: 15 },
      thirdRelease: { total: 160, remaining: 0, price: 18 },
    }
  );
  const [loading, setLoading] = useState<boolean>(!initialTicketsData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTicketsData) return; // Ne pas fetcher si des données initiales sont fournies

    const fetchRemainingTickets = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/ticket/places-restantes');

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des places restantes');
        }

        const data = await response.json();

        setTicketsData({
          earlyBird: {
            total: 30,
            remaining: data.earlyBird || 0,
            price: 10,
          },
          secondRelease: {
            total: 60,
            remaining: data.secondRelease || 0,
            price: 15,
          },
          thirdRelease: {
            total: 160,
            remaining: data.thirdRelease || 0,
            price: 18,
          },
        });

        setLoading(false);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Impossible de charger les places disponibles');
        setLoading(false);
      }
    };

    fetchRemainingTickets();

    // Actualiser les données toutes les 30 secondes
    const intervalId = setInterval(fetchRemainingTickets, 30000);

    return () => clearInterval(intervalId);
  }, [initialTicketsData]);

  // Fonction pour formater l'affichage des catégories
  const formatCategoryName = (category: string): string => {
    const names: Record<string, string> = {
      earlyBird: "Early Bird",
      secondRelease: "Second Release",
      thirdRelease: "Third Release",
    };
    return names[category] || category;
  };

  // Fonction pour déterminer la catégorie active
  const getActiveCategory = (): string | null => {
    if (ticketsData.earlyBird.remaining > 0) return 'earlyBird';
    if (ticketsData.secondRelease.remaining > 0) return 'secondRelease';
    if (ticketsData.thirdRelease.remaining > 0) return 'thirdRelease';
    return null; // Tous les billets sont épuisés
  };

  // Fonction pour afficher les places restantes selon la catégorie (uniquement pour la catégorie active)
  const getAvailabilityDescription = (
    category: string,
    data: TicketData,
    isActive: boolean
  ): string => {
    if (data.remaining <= 0) {
      return "SOLD OUT";
    }

    // N'afficher le nombre de places que pour la catégorie active
    if (isActive) {
      // Pour Third Release, afficher en pourcentage
      if (category === 'thirdRelease') {
        const percentage = Math.round((data.remaining / data.total) * 100);
        return `${percentage}% restant`;
      }

      // Pour les autres catégories, afficher le nombre exact
      return `Plus que ${data.remaining} places`;
    }

    // Supprimer les textes "Places disponibles" et "Disponible bientôt"
    return ""; // Retourner une chaîne vide pour les autres cas
  };

  const activeCategory = getActiveCategory();

  // Si chargement en cours
  if (loading) {
    return (
      <div className="w-11/12 md:w-2/3 mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
        <div className="col-span-3 text-center py-8">
          <div className="animate-pulse text-xl">Chargement des tarifs...</div>
        </div>
      </div>
    );
  }

  // Si erreur
  if (error) {
    return (
      <div className="w-11/12 md:w-2/3 mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
        <div className="col-span-3 text-center py-8 text-red-500">
          <div>{error}</div>
        </div>
      </div>
    );
  }

  // Si tous les billets sont épuisés
  if (!activeCategory) {
    return (
      <div id="tarifs" className="w-11/12 md:w-2/3 mx-auto mb-20">
        <div className="text-center p-8 bg-red-800/20 rounded-lg border border-red-800/50">
          <h2 className="text-2xl font-bold mb-4">Toutes les places sont épuisées</h2>
          <p className="mb-4">Désolé, il n'y a plus de billets disponibles pour cet événement.</p>
        </div>
      </div>
    );
  }

  // Rendu avec seulement les catégories disponibles ou marquées comme épuisées
  return (
    <div id="tarifs" className="w-11/12 md:w-2/3 mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
      {Object.entries(ticketsData).map(([category, data]) => {
        const isSoldOut = data.remaining <= 0;
        const isActiveCategory = category === activeCategory;

        // Ne pas afficher les catégories précédentes qui sont épuisées
        // (sauf la catégorie active, qui est affichée même si épuisée)
        if (
          isSoldOut &&
          !isActiveCategory &&
          ((category === 'earlyBird' && ticketsData.secondRelease.remaining > 0) ||
            (category === 'secondRelease' && ticketsData.thirdRelease.remaining > 0))
        ) {
          return null;
        }

        // Déterminer si cette catégorie est "pas encore atteinte"
        const isFutureCategory =
          !isSoldOut &&
          !isActiveCategory &&
          ((category === 'secondRelease' && ticketsData.earlyBird.remaining > 0) ||
            (category === 'thirdRelease' &&
              (ticketsData.earlyBird.remaining > 0 || ticketsData.secondRelease.remaining > 0)));

        return (
          <Card
            key={category}
            className={`min-w-44 transition-all ${
              isSoldOut
                ? 'opacity-70'
                : isActiveCategory
                ? 'ring ring-purple-500 shadow-lg'
                : ''
            }`}
          >
            <CardHeader>
              <CardTitle
                className={isSoldOut ? 'line-through text-gray-500' : ''}
              >
                {formatCategoryName(category)}
              </CardTitle>
              <CardDescription>
                {getAvailabilityDescription(category, data, isActiveCategory)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CardTitle
                className={`text-4xl mb-2 ${
                  isSoldOut ? 'line-through text-gray-500' : ''
                }`}
              >
                {data.price}-
              </CardTitle>
            </CardContent>
            <CardFooter>
              {isSoldOut ? (
                <Button variant="outline" className="mt-2 w-full" disabled>
                  Épuisé
                </Button>
              ) : isFutureCategory ? (
                <Button variant="outline" className="mt-2 w-full" disabled>
                  Bientôt disponible
                </Button>
              ) : (
                <Link href="/payment" className="w-full">
                  <Button variant="outline" className="mt-2 w-full">
                    Acheter maintenant
                  </Button>
                </Link>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}