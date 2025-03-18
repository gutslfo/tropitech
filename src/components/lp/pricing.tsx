import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
  } from "@/components/ui/card"
import { Button } from "../ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"

export default function PricingCard() {
	return (
		<div id="tarifs" className="w-11/12 md:w-2/3 mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
		<Dialog>
			<Card className="min-w-44">
				<CardHeader>
					<CardTitle>Early Bird</CardTitle>
					<CardDescription>Plus que 9 places restantes</CardDescription>
				</CardHeader>
				<CardContent>
					<CardTitle className="text-4xl mb-2">10.-</CardTitle>
				</CardContent>
				<CardFooter>
					<DialogTrigger asChild>
						<Button variant={"outline"} className="mt-2 w-full">Acheter maintenant</Button>
					</DialogTrigger>
				</CardFooter>
			</Card>
			<Card className="min-w-44">
				<CardHeader>
					<CardTitle>2nd Release</CardTitle>
					<CardDescription>Plus que 26 places restantes</CardDescription>
				</CardHeader>
				<CardContent>
					<CardTitle className="text-4xl mb-2">15.-</CardTitle>
				</CardContent>
				<CardFooter>
					<DialogTrigger asChild>
						<Button variant={"outline"} className="mt-2 w-full">Acheter maintenant</Button>
					</DialogTrigger>
				</CardFooter>
			</Card>
			<Card className="min-w-44">
				<CardHeader>
					<CardTitle>3rd Release</CardTitle>
					<CardDescription>Places illimitées</CardDescription>
				</CardHeader>
				<CardContent>
					<CardTitle className="text-4xl mb-2">18.-</CardTitle>
				</CardContent>
				<CardFooter className="w-full self-end">
					<DialogTrigger asChild>
						<Button variant={"outline"} className="mt-2 w-full">Acheter maintenant</Button>
					</DialogTrigger>
				</CardFooter>
			</Card>
			<DialogContent>
				<DialogHeader>
				<DialogTitle>Droit à l'image</DialogTitle>
				<DialogDescription>
					Vous devez accepter le droit à l'image avant de pouvoir acheter
				</DialogDescription>
				</DialogHeader>
				<h1>J'accepte que mon image et ma voix soient utilisées sous forme de photos, vidéos et autres contenus enregistrés pendant l'événement.<br/><br/>Ces contenus pourront être diffusés à des fins de promotion et de communication sur des supports comme les réseaux sociaux, sites internet, etc.<br/><br/>Pour plus d’informations, consultez nos conditions d’utilisation et politique de confidentialité.</h1>
				<div className="w-full flex justify-end items-center mt-3">
					<Button>J'accepte</Button>
				</div>
			</DialogContent>
		</Dialog>
		</div>
	)
}