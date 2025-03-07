"use client"

import NavBar from "@/components/lp/nav";
import { HeroGeometric2 } from "@/components/ui/hero";
import {
	HomeIcon,
	CalendarIcon,
	ListBulletIcon
} from "@radix-ui/react-icons";
import { BentoCard } from "@/components/ui/bento-grid";

const date = {
	Icon: CalendarIcon,
	name: "Date",
	description: "19 Avril 2025",
	href: "/details",
	cta: "En savoir plus",
	background: <img className="absolute -right-20 -top-20 opacity-60" />,
	className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
}

const lieu = {
	Icon: HomeIcon,
	name: "Lieu",
	description: "Caves du Château, Rue du Greny",
	href: "/details",
	cta: "En savoir plus",
	background: <img className="absolute -right-20 -top-20 opacity-60" />,
	className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
}

const lineUp = {
	Icon: ListBulletIcon,
	name: "LineUp",
	description: (
		<>
			<br />
			21:00 - JCVD (House)
			<span className="block h-2" />
			22:00 - Michael Jackson (Acide Core)
			<span className="block h-2" />
			23:00 - Jeffrey Damer (Reggae)
			<span className="block h-2" />
			00:00 - Mickey Mouse (Trap)
		</>
	  ),
	href: "/details",
	cta: "En savoir plus",
	background: <img className="absolute -right-20 -top-20 opacity-60" />,
	className: "order-last lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
}

export default function Home() {
	return (
		<>
			<NavBar />
			<HeroGeometric2 badge="Soirée Tech" title1="" title2="Tropitech" />
			<div className="w-2/3 h-auto mx-auto flex flex-col justify-center items-center gap-5 mb-96">
				<div className="w-full grid grid-cols-2 gap-5">
					<BentoCard key={lieu.name} {...lieu} />
					<BentoCard key={lineUp.name} {...lineUp} />
					<BentoCard key={date.name} {...date} />
				</div>
			</div>
		</>
	);
}
