import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import TicketAvailability from './TicketAvailability';

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  
  // États du formulaire
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [imageConsent, setImageConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // États pour le paiement
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [activePrice, setActivePrice] = useState(0);
  const [activeCategory, setActiveCategory] = useState('');
  const [paymentMethods, setPaymentMethods] = useState(['card']);
  
  // État pour la validation du formulaire
  const [errors, setErrors] = useState({});
  
  // Récupérer le prix actif en fonction des places disponibles
  useEffect(() => {
    const fetchTicketPrices = async () => {
      try {
        const response = await fetch('/api/ticket/places-restantes');
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des places');
        }
        
        const data = await response.json();
        
        // Déterminer la catégorie active
        let price = 45; // Prix par défaut (thirdRelease)
        let category = 'thirdRelease';
        
        if (data.earlyBird > 0) {
          price = 25;
          category = 'earlyBird';
        } else if (data.secondRelease > 0) {
          price = 35;
          category = 'secondRelease';
        } else if (data.thirdRelease > 0) {
          price = 45;
          category = 'thirdRelease';
        }
        
        setActivePrice(price);
        setActiveCategory(category);
      } catch (error) {
        console.error('Erreur:', error);
        // Utiliser les valeurs par défaut
        setActivePrice(45);
        setActiveCategory('thirdRelease');
      }
    };
    
    fetchTicketPrices();
  }, []);

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) newErrors.name = 'Le nom est requis';
    if (!firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    
    if (!email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'L\'email est invalide';
    }
    
    if (!imageConsent) newErrors.imageConsent = 'Vous devez accepter le droit à l\'image';
    if (!termsAccepted) newErrors.termsAccepted = 'Vous devez accepter les conditions';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Réinitialiser les messages d'erreur
    setPaymentError(null);
    
    // Valider le formulaire
    if (!validateForm()) {
      return;
    }
    
    // Vérifier que Stripe est chargé
    if (!stripe || !elements) {
      setPaymentError("La connexion à Stripe est en cours, veuillez réessayer.");
      return;
    }
    
    // Démarrer le traitement du paiement
    setProcessingPayment(true);
    
    try {
      // 1. Créer l'intention de paiement côté serveur
      const response = await fetch('/api/payment/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: activePrice * 100, // Stripe utilise les centimes
          email,
          name,
          firstName,
          imageConsent,
          category: activeCategory
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du paiement');
      }
      
      const data = await response.json();
      setClientSecret(data.clientSecret);
      
      // Si Stripe nous renvoie des méthodes de paiement disponibles
      if (data.payment_method_types) {
        setPaymentMethods(data.payment_method_types);
      }
      
      // 2. Confirmer le paiement avec les informations de carte
      const cardElement = elements.getElement(CardElement);
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${firstName} ${name}`,
            email: email,
          },
        },
      });
      
      if (error) {
        throw new Error(error.message || 'Erreur lors du paiement');
      }
      
      // Paiement réussi
      if (paymentIntent.status === 'succeeded') {
        setPaymentSuccess(true);
        // Rediriger vers la page de succès
        window.location.href = `/success?paymentId=${paymentIntent.id}`;
      } else {
        throw new Error('Le statut du paiement est: ' + paymentIntent.status);
      }
    } catch (error) {
      console.error('Erreur de paiement:', error);
      setPaymentError(error.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  // En cas de places épuisées
  if (activePrice === 0) {
    return (
      <div className="text-center p-8 bg-red-800 rounded-lg shadow-lg">
        <h2 className="text-2xl text-white font-bold mb-4">Toutes les places sont épuisées</h2>
        <p className="text-white mb-4">Désolé, il n'y a plus de billets disponibles pour cet événement.</p>
      </div>
    );
  }

  // Afficher le formulaire de succès si le paiement est réussi
  if (paymentSuccess) {
    return (
      <div className="text-center p-8 bg-green-800 rounded-lg shadow-lg">
        <h2 className="text-2xl text-white font-bold mb-4">Paiement réussi !</h2>
        <p className="text-white mb-4">Votre billet vous sera envoyé par email très prochainement.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <TicketAvailability />
      
      <div className="bg-black text-white rounded-lg p-6 shadow-lg mt-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Réservation de billet</h2>
        
        <div className="bg-purple-900 p-4 rounded-md mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Prix actuel:</h3>
            <span className="text-2xl font-bold">{activePrice} CHF</span>
          </div>
          <p className="text-sm mt-2">Catégorie: {activeCategory === 'earlyBird' ? 'Early Bird' : activeCategory === 'secondRelease' ? 'Second Release' : 'Third Release'}</p>
        </div>
        
        {paymentError && (
          <div className="bg-red-800 text-white p-4 rounded-md mb-6">
            <p className="font-bold">Erreur de paiement:</p>
            <p>{paymentError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Nom */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Nom</label>
              <input
                type="text"
                id="name"
                className={`w-full px-4 py-2 rounded-md bg-gray-800 text-white border ${errors.name ? 'border-red-500' : 'border-gray-600'}`}
                placeholder="Votre nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>
            
            {/* Prénom */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1">Prénom</label>
              <input
                type="text"
                id="firstName"
                className={`w-full px-4 py-2 rounded-md bg-gray-800 text-white border ${errors.firstName ? 'border-red-500' : 'border-gray-600'}`}
                placeholder="Votre prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
            </div>
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                id="email"
                className={`w-full px-4 py-2 rounded-md bg-gray-800 text-white border ${errors.email ? 'border-red-500' : 'border-gray-600'}`}
                placeholder="Votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>
            
            {/* Informations de paiement */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Informations de paiement</h3>
              <div className="bg-gray-800 p-4 rounded-md">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#fff',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#fa755a',
                      },
                    },
                  }}
                />
              </div>
              {paymentMethods.includes('twint') && (
                <p className="mt-2 text-sm text-gray-300">TWINT est également disponible comme option de paiement.</p>
              )}
            </div>
            
            {/* Consent checkbox */}
            <div className="mt-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="imageConsent"
                  className="mt-1"
                  checked={imageConsent}
                  onChange={(e) => setImageConsent(e.target.checked)}
                />
                <label htmlFor="imageConsent" className="ml-2 text-sm">
                  J'autorise l'organisation à utiliser les photos et vidéos prises lors de l'événement à des fins promotionnelles.
                </label>
              </div>
              {errors.imageConsent && <p className="mt-1 text-sm text-red-500">{errors.imageConsent}</p>}
            </div>
            
            {/* Terms checkbox */}
            <div className="mt-2">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="termsAccepted"
                  className="mt-1"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <label htmlFor="termsAccepted" className="ml-2 text-sm">
                  J'accepte les conditions générales de vente et la politique de confidentialité.
                </label>
              </div>
              {errors.termsAccepted && <p className="mt-1 text-sm text-red-500">{errors.termsAccepted}</p>}
            </div>
            
            {/* Submit button */}
            <div className="mt-6">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-md shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={processingPayment || !stripe}
              >
                {processingPayment ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Traitement en cours...
                  </span>
                ) : (
                  `Payer ${activePrice} CHF`
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Pour toute question, veuillez nous contacter à <a href="mailto:contact@tropitech.ch" className="text-purple-400 hover:text-purple-300">contact@tropitech.ch</a></p>
      </div>
    </div>
  );
};

export default CheckoutForm;