import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
  } from "@/components/ui/card"
import { Button } from "../ui/button"

export default function PricingCard() {
	return (
		<div id="tarifs" className="w-11/12 md:w-2/3 mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
			<Card className="min-w-44">
				<CardHeader>
					<CardTitle>Early Bird</CardTitle>
					<CardDescription>Uniquement 30 places disponibles</CardDescription>
				</CardHeader>
				<CardContent>
					<CardTitle className="text-4xl mb-2">10.-</CardTitle>
					<p>- Pour les plus rapides d'entre vous</p>
					<p>- Plus que 27 places restantes...</p>
				</CardContent>
				<CardFooter>
					<Button variant={"outline"} className="mt-2 w-full">Acheter maintenant</Button>
				</CardFooter>
			</Card>
			<Card className="min-w-44">
				<CardHeader>
					<CardTitle>2nd Release</CardTitle>
					<CardDescription>Uniquement 70 places disponibles</CardDescription>
				</CardHeader>
				<CardContent>
					<CardTitle className="text-4xl mb-2">15.-</CardTitle>
					<p>- Pour les plus motivés</p>
					<p>- Plus que 65 places restantes...</p>
				</CardContent>
				<CardFooter>
					<Button variant={"outline"} className="mt-2 w-full">Acheter maintenant</Button>
				</CardFooter>
			</Card>
			<Card className="min-w-44">
				<CardHeader>
					<CardTitle>3rd Release</CardTitle>
					<CardDescription>Places illimitées</CardDescription>
				</CardHeader>
				<CardContent>
					<CardTitle className="text-4xl mb-2">18.-</CardTitle>
					<p>- Pour les foufous de sochaux</p>
					<p>- Plus que... non jrgl c'est illimité</p>
				</CardContent>
				<CardFooter className="w-full self-end">
					<Button variant={"outline"} className="mt-2 w-full">Acheter maintenant</Button>
				</CardFooter>
			</Card>
		</div>
	)
}