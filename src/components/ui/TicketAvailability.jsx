import React, { useState, useEffect } from 'react';

const TicketAvailability = () => {
  const [ticketsData, setTicketsData] = useState({
    earlyBird: { total: 30, remaining: 0, price: 10 },
    secondRelease: { total: 60, remaining: 0, price: 15 },
    thirdRelease: { total: 160, remaining: 0, price: 18 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
            ...ticketsData.earlyBird, 
            remaining: data.earlyBird || 0 
          },
          secondRelease: { 
            ...ticketsData.secondRelease, 
            remaining: data.secondRelease || 0 
          },
          thirdRelease: { 
            ...ticketsData.thirdRelease, 
            remaining: data.thirdRelease || 0 
          }
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
  }, []);

  // Détermine la catégorie active : la première où il reste des places.
  const getActiveCategory = () => {
    if (ticketsData.earlyBird.remaining > 0) return 'earlyBird';
    if (ticketsData.secondRelease.remaining > 0) return 'secondRelease';
    if (ticketsData.thirdRelease.remaining > 0) return 'thirdRelease';
    return null;
  };

  const activeCategory = getActiveCategory();
  
  // Vérifier s'il reste des places disponibles
  const noTicketsLeft = !activeCategory;

  // Pour connaître l'ordre : earlyBird -> secondRelease -> thirdRelease
  const categoriesOrder = ['earlyBird', 'secondRelease', 'thirdRelease'];
  const activeIndex = activeCategory
    ? categoriesOrder.indexOf(activeCategory)
    : -1;

  // Fonction qui renvoie le texte à afficher selon la situation
  // - "Épuisé" si on est passé à la catégorie suivante
  // - Le nombre de places si c’est la catégorie active
  // - Vide ("") si on n’y est pas encore
  const getRemainingDisplay = (categoryKey, data) => {
    // Si plus aucune place totale (tout épuisé), on affiche "Épuisé" partout
    if (noTicketsLeft) {
      return data.remaining > 0 ? data.remaining : 'Épuisé';
    }

    const catIndex = categoriesOrder.indexOf(categoryKey);
    if (catIndex < activeIndex) {
      // Catégorie déjà dépassée
      return 'Épuisé';
    } else if (catIndex === activeIndex) {
      // Catégorie active
      if (categoryKey === 'thirdRelease') {
        // Afficher en pourcentage pour "3rd Release"
        const percentage = ((data.remaining / data.total) * 100).toFixed(1);
        return `${percentage}% disponibles`;
      }
      return data.remaining > 0 ? data.remaining : 'Épuisé';
    } else {
      // Catégorie pas encore atteinte => masque le nombre
      return '';
    }
  };

  // Fonction pour formater l'affichage des catégories
  const formatCategoryName = (category) => {
    const names = {
      earlyBird: 'Early Bird',
      secondRelease: 'Second Release',
      thirdRelease: 'Third Release'
    };
    return names[category] || category;
  };

  if (loading) {
    return <div className="text-center py-4">Chargement des places disponibles...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <div className="bg-black text-white rounded-lg p-6 shadow-lg max-w-md mx-auto my-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Disponibilité des billets</h2>
      
      {noTicketsLeft ? (
        <div className="text-center py-4 bg-red-900 rounded-md">
          <p className="text-xl font-semibold">Billets épuisés</p>
          <p className="mt-2">Toutes les places ont été vendues.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {Object.entries(ticketsData).map(([category, data]) => {
              const displayRemaining = getRemainingDisplay(category, data);

              return (
                <div
                  key={category}
                  className={`p-4 rounded-md transition-all ${
                    category === activeCategory
                      ? 'bg-gradient-to-r from-purple-900 to-indigo-900 border-l-4 border-yellow-400'
                      : 'bg-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">{formatCategoryName(category)}</h3>
                    <span className="text-lg font-bold">{data.price} CHF</span>
                  </div>

                  <div className="mt-2">
                    {/* 
                      - Si displayRemaining === "" => on n’affiche pas les "Places restantes" 
                      - Si "Épuisé" => on affiche un <span className="text-red-400">Épuisé</span>
                      - Sinon on affiche le nombre ou le pourcentage
                    */}
                    {displayRemaining === '' ? null : displayRemaining === 'Épuisé' ? (
                      <span className="text-red-400">Épuisé</span>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span>Places restantes:</span>
                        <span className="font-semibold text-yellow-300">
                          {displayRemaining}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Barre de progression (inchangée) */}
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-green-500 h-2.5 rounded-full"
                      style={{
                        width: `${100 - (data.remaining / data.total) * 100}%`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {activeCategory && (
            <div className="mt-6 text-center">
              <p>
                Catégorie active:{' '}
                <span className="font-bold text-yellow-300">
                  {formatCategoryName(activeCategory)}
                </span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TicketAvailability;
