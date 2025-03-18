import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function pc() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center border-b pb-6">
          <CardTitle className="text-2xl md:text-3xl">Politique de Confidentialité</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-bold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground">
                Cette Politique de Confidentialité décrit comment Etaris collecte, utilise, protège et partage vos
                données personnelles lors de votre utilisation du Site. Nous nous engageons à respecter la loi fédérale
                suisse sur la protection des données (LPD) pour assurer la sécurité de vos informations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">2. Collecte des données personnelles</h2>
              <p className="text-muted-foreground mb-2">
                Nous collectons les informations suivantes lorsque vous utilisez nos services :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Informations de contact : nom, prénom, adresse e-mail, etc.</li>
                <li>
                  Données de paiement : informations de carte bancaire (via notre partenaire Stripe) ou d'autres moyens
                  de paiement.
                </li>
                <li>Informations de transaction : informations relatives à vos paiements et achats.</li>
                <li>
                  Droit à l'image : lors de certains événements, vous pouvez être photographié(e) ou filmé(e), et vous
                  nous donnez votre consentement pour l'utilisation de votre image.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">3. Utilisation des données personnelles</h2>
              <p className="text-muted-foreground mb-2">Les données collectées sont utilisées pour :</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Gérer vos achats et transactions.</li>
                <li>Améliorer nos services et l'expérience utilisateur.</li>
                <li>
                  Vous envoyer des communications concernant les événements, paiements ou informations pertinentes.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">4. Partage des données personnelles</h2>
              <p className="text-muted-foreground mb-2">
                Nous ne partageons vos données personnelles qu'avec des tiers dans les cas suivants :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>
                  Prestataires de services : tels que les processeurs de paiement comme Stripe, pour traiter les
                  transactions.
                </li>
                <li>
                  Exigences légales : si la loi nous oblige à partager vos données, ou pour protéger nos droits et ceux
                  des autres.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">5. Protection des données personnelles</h2>
              <p className="text-muted-foreground">
                Nous prenons des mesures de sécurité techniques et organisationnelles pour protéger vos données
                personnelles contre la perte, l'accès non autorisé et la divulgation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">6. Vos droits concernant vos données</h2>
              <p className="text-muted-foreground mb-2">
                Conformément à la loi suisse sur la protection des données, vous avez le droit de :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Accéder à vos données personnelles.</li>
                <li>Rectifier vos données personnelles si elles sont incorrectes.</li>
                <li>Demander la suppression de vos données personnelles.</li>
                <li>Limiter ou interdire le traitement de vos données personnelles.</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Pour exercer ces droits, vous pouvez nous contacter à l'adresse suivante : etaris.collective@gmail.com.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">7. Cookies et technologies de suivi</h2>
              <p className="text-muted-foreground">
                Nous utilisons des cookies pour améliorer l'expérience utilisateur sur le Site. En utilisant notre Site,
                vous consentez à l'utilisation de ces cookies conformément à notre politique sur les cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">8. Modifications de la Politique de Confidentialité</h2>
              <p className="text-muted-foreground">
                Nous nous réservons le droit de modifier cette politique de confidentialité. Les modifications seront
                publiées sur cette page. Il est recommandé de consulter régulièrement cette politique pour vous assurer
                que vous êtes d'accord avec ses termes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">9. Contact</h2>
              <p className="text-muted-foreground">
                Pour toute question concernant cette Politique de Confidentialité, vous pouvez nous contacter à
                l'adresse suivante : etaris.collective@gmail.com.
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

