import React, { useState, useEffect, useCallback } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Link from 'next/link';

// Configuration des prix - idéalement charger depuis le serveur
const PRICES = {
  earlyBird: 10,
  secondRelease: 15,
  thirdRelease: 18,
};

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

  // États pour la catégorie et son prix
  const [activePrice, setActivePrice] = useState(0);
  const [activeCategory, setActiveCategory] = useState('');

  // État pour la validation du formulaire
  const [errors, setErrors] = useState({});

  // Récupérer le prix actif et la catégorie en fonction des places
  const fetchTicketPrices = useCallback(async () => {
    try {
      setPaymentError(null);
      const response = await fetch('/api/ticket/places-restantes');

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des places');
      }

      const data = await response.json();

      // Déterminer la catégorie active
      let price = 0;
      let category = '';

      if (data.earlyBird > 0) {
        price = PRICES.earlyBird;
        category = 'earlyBird';
      } else if (data.secondRelease > 0) {
        price = PRICES.secondRelease;
        category = 'secondRelease';
      } else if (data.thirdRelease > 0) {
        price = PRICES.thirdRelease;
        category = 'thirdRelease';
      } else {
        // Toutes les places épuisées
        price = 0;
        category = '';
      }

      setActivePrice(price);
      setActiveCategory(category);
    } catch (error) {
      console.error('Erreur:', error);
      setPaymentError('Impossible de charger les prix. Veuillez rafraîchir la page.');
      // Valeurs par défaut en cas d'erreur
      setActivePrice(PRICES.thirdRelease);
      setActiveCategory('thirdRelease');
    }
  }, []);

  useEffect(() => {
    fetchTicketPrices();

    // Rafraîchir les prix toutes les 30 secondes
    const intervalId = setInterval(fetchTicketPrices, 30000);
    return () => clearInterval(intervalId);
  }, [fetchTicketPrices]);

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) newErrors.name = 'Le nom est requis';
    if (!firstName.trim()) newErrors.firstName = 'Le prénom est requis';

    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "L'email est invalide";
    }

    if (!imageConsent) newErrors.imageConsent = "Vous devez accepter le droit à l'image";
    if (!termsAccepted) newErrors.termsAccepted = 'Vous devez accepter les conditions';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async (event) => {
    event.preventDefault();
    setPaymentError(null);

    // Validation
    if (!validateForm()) return;

    // Stripe chargé ?
    if (!stripe || !elements) {
      setPaymentError('La connexion à Stripe est en cours, veuillez réessayer.');
      return;
    }

    setProcessingPayment(true);

    try {
      // 1. Créer l'intention de paiement
      const response = await fetch('/api/payment/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: activePrice * 100, // En centimes
          email,
          name,
          firstName,
          imageConsent,
          category: activeCategory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du paiement');
      }

      const data = await response.json();

      // 2. Confirmer le paiement
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

      if (error) throw new Error(error.message || 'Erreur lors du paiement');

      // Paiement réussi ?
      if (paymentIntent.status === 'succeeded') {
        setPaymentSuccess(true);
        window.location.href = `/success?paymentId=${paymentIntent.id}`;
      } else {
        throw new Error(`Le statut du paiement est: ${paymentIntent.status}`);
      }
    } catch (error) {
      console.error('Erreur de paiement:', error);
      setPaymentError(error.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Gérer la déconnexion de Stripe ou l'absence de catégorie active
  if (!stripe || !activeCategory) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="text-center p-8 bg-black rounded-lg shadow-lg">
          <h2 className="text-2xl text-white font-bold mb-4">
            {!stripe ? 'Connexion à Stripe en cours...' : 'Aucune place disponible'}
          </h2>
          <p className="text-white mb-4">
            {!stripe
              ? 'Veuillez patienter pendant que nous établissons la connexion sécurisée.'
              : "Désolé, il n'y a plus de billets disponibles pour cet événement."}
          </p>
          {!stripe ? (
            <div className="animate-pulse text-white">Chargement...</div>
          ) : (
            <Link href="/" className="text-blue-400 hover:text-blue-300 underline">
              Retour à l'accueil
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Succès du paiement
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
      <div className="bg-black text-white rounded-lg p-6 shadow-lg mt-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Réservation de billet</h2>

        <div className="bg-purple-900 p-4 rounded-md mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">
              {activeCategory === 'earlyBird'
                ? 'Early Bird'
                : activeCategory === 'secondRelease'
                ? 'Second Release'
                : 'Third Release'}
            </h3>
            <span className="text-2xl font-bold">{activePrice} CHF</span>
          </div>
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
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Nom
              </label>
              <input
                type="text"
                id="name"
                className={`w-full px-4 py-2 rounded-md bg-gray-800 text-white border ${
                  errors.name ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Votre nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Prénom */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                Prénom
              </label>
              <input
                type="text"
                id="firstName"
                className={`w-full px-4 py-2 rounded-md bg-gray-800 text-white border ${
                  errors.firstName ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Votre prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                className={`w-full px-4 py-2 rounded-md bg-gray-800 text-white border ${
                  errors.email ? 'border-red-500' : 'border-gray-600'
                }`}
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
                        '::placeholder': { color: '#aab7c4' },
                      },
                      invalid: { color: '#fa755a' },
                    },
                  }}
                />
              </div>
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
                  J'autorise l'organisation à utiliser les photos et vidéos prises lors de
                  l'événement à des fins promotionnelles.
                </label>
              </div>
              {errors.imageConsent && (
                <p className="mt-1 text-sm text-red-500">{errors.imageConsent}</p>
              )}
            </div>

            {/* Terms checkbox avec liens */}
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
                  J'accepte les{' '}
                  <Link
                    href="/cgu"
                    target="_blank"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    conditions générales
                  </Link>{' '}
                  et la{' '}
                  <Link
                    href="/pc"
                    target="_blank"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    politique de confidentialité
                  </Link>
                  .
                </label>
              </div>
              {errors.termsAccepted && (
                <p className="mt-1 text-sm text-red-500">{errors.termsAccepted}</p>
              )}
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
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 
                          0 0 5.373 0 12h4zm2 
                          5.291A7.962 
                          7.962 0 014 12H0c0 
                          3.042 1.135 5.824 3 
                          7.938l3-2.647z"
                      ></path>
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
        <p>
          Pour toute question, veuillez nous contacter à{' '}
          <a
            href="mailto:etaris.collective@gmail.com"
            className="text-purple-400 hover:text-purple-300"
          >
            contact@tropitech.ch
          </a>
        </p>
      </div>
    </div>
  );
};

export default CheckoutForm;