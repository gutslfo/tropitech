import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CGU() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center border-b pb-6">
          <CardTitle className="text-2xl md:text-3xl">Conditions Générales d'Utilisation (CGU)</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-bold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground">
                Bienvenue sur tropitech.ch (ci-après le "Site"). En utilisant ce Site, vous acceptez de vous conformer
                aux présentes Conditions Générales d'Utilisation (CGU). Ces CGU régissent l'accès et l'utilisation du
                Site, ainsi que des services associés. Si vous n'acceptez pas ces CGU, vous ne devez pas utiliser ce
                Site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">2. Services</h2>
              <p className="text-muted-foreground">
                Etaris fournit des services en ligne liés à la vente de billets. Nous nous réservons le droit de
                modifier, suspendre ou interrompre tout service à tout moment, sans préavis.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">3. Obligations de l'utilisateur</h2>
              <p className="text-muted-foreground mb-2">En tant qu'utilisateur, vous vous engagez à :</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>
                  Fournir des informations exactes et complètes lors de l'enregistrement et de l'utilisation de nos
                  services.
                </li>
                <li>Utiliser nos services uniquement à des fins légales et conformes aux CGU.</li>
                <li>
                  Ne pas perturber, endommager ou accéder de manière non autorisée à notre infrastructure ou à nos
                  systèmes.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">4. Propriété intellectuelle</h2>
              <p className="text-muted-foreground">
                Tous les contenus du Site (textes, images, logos, vidéos, etc.) sont protégés par des droits de
                propriété intellectuelle. Toute utilisation non autorisée de ces éléments est strictement interdite.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">5. Droit à l'image</h2>
              <p className="text-muted-foreground">
                L'utilisateur consent à ce que son image soit utilisée dans le cadre de l'événement pour lequel il a
                acheté un billet, selon les termes définis dans notre politique de confidentialité et la loi suisse sur
                le droit à l'image (LDA).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">6. Responsabilités</h2>
              <p className="text-muted-foreground">
                Etaris ne peut être tenue responsable des dommages directs ou indirects résultant de l'utilisation du
                Site ou des services fournis. En cas de force majeure, nous déclinons toute responsabilité.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">7. Protection des données personnelles</h2>
              <p className="text-muted-foreground">
                Vos données personnelles sont collectées et traitées conformément à notre politique de confidentialité.
                En accédant au Site, vous acceptez les conditions de collecte et d'utilisation de vos données
                personnelles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">8. Modifications des CGU</h2>
              <p className="text-muted-foreground">
                Nous nous réservons le droit de modifier les présentes CGU à tout moment. Vous serez informé de ces
                modifications par une notification sur le Site. Il vous appartient de consulter régulièrement les CGU
                pour vous assurer que vous êtes d'accord avec leurs termes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">9. Droit applicable et juridiction compétente</h2>
              <p className="text-muted-foreground">
                Les présentes CGU sont régies par le droit suisse. En cas de litige, les tribunaux compétents du canton
                de Vaud seront seuls compétents.
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

