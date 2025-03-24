export default function SuccessPage() {
  return (
      <div className="container mx-auto text-center p-6">
          <h1 className="text-3xl font-bold text-green-600">🎉 Paiement Réussi !</h1>
          <p className="text-lg mt-4">Merci pour votre achat. Vous recevrez bientôt un email de confirmation.</p>
          <a href="/" className="text-blue-500 underline mt-4 block">Retour à l'accueil</a>
      </div>
  );
}
