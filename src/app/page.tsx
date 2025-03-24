"use client"

import NavBar from "@/components/lp/nav";
import { HeroGeometric2 } from "@/components/ui/hero";
import {
	DiscIcon,
	CalendarIcon,
	ListBulletIcon
} from "@radix-ui/react-icons";
import { BentoCard } from "@/components/ui/bento-grid";
import { Tilt } from "@/components/ui/tilt";
import PricingCard from "@/components/lp/pricing";
import { FAQ } from "@/components/lp/faq";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import { Castle } from "lucide-react";
import Link from "next/link";
import { FaInstagram } from "react-icons/fa";

const date = {
	Icon: CalendarIcon,
	name: "Date",
	description: "19 Avril 2025",
	href: "#tarifs",
	cta: "Je viens",
	background: <img className="absolute -right-20 -top-20 opacity-60" />,
	// En lg, la carte Date occupe la première colonne de la première rangée
	className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2",
}

const lieu = {
	Icon: Castle,
	name: "Lieu",
	description: "Coopet, Caves du Château, Rue du Greny",
	href: "https://maps.app.goo.gl/7D6145TF1Q7NVCnB6",
	cta: "Voir sur Google Maps",
	background: <img className="absolute -right-20 -top-20 opacity-60" />,
	// En lg, la carte Lieu occupe la deuxième colonne de la première rangée
	className: "lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2",
}

const lineUp = {
	Icon: DiscIcon,
	name: "Lineup",
	description: (
		<>
			<br />
			20:00 - MOONA
			<span className="block h-2" />
			21:00 - Edo B2B Lutchi
			<span className="block h-2" />
			22:00 - Cazoule B2B Alzing
			<span className="block h-2" />
			00:00 - EREIB
			<span className="block h-2" />
			01:30 - Cadence
			<span className="block h-2" />
			03:00 - Götz B2B Venuss
		</>
	),
	href: "#tarifs",
	cta: "Je viens",
	background: <img className="absolute -right-20 -top-20 opacity-60" />,
	// Pour sm, on conserve l'ordre naturel, mais en lg, cette carte passe en dernière rangée et occupe les deux colonnes
	className: "order-last lg:col-start-1 lg:col-end-3 lg:row-start-2 lg:row-end-3",
}

export default function Home() {
	return (
		<>
			<NavBar />
			<HeroGeometric2 badge="Echoes of the Jungle" title1="" title2="Tropitech" />
			<div id="info" className="w-11/12 md:w-2/3 h-auto mx-auto flex flex-col justify-center items-center gap-5 my-20">
				<div className="w-full grid grid-cols-2 gap-5">
					<BentoCard key={lieu.name} {...lieu} />
					<BentoCard key={lineUp.name} {...lineUp} />
					<BentoCard key={date.name} {...date} />
				</div>
			</div>
			<PricingCard />
			{/* <div className="w-11/12 md:w-2/3 h-auto mx-auto flex flex-col justify-center items-center gap-5 mb-20">
				<div className="w-full grid grid-cols-1 md:grid-cols-3 place-items-center place-content-between gap-5">
					<Tilt rotationFactor={8} isRevese>
					<div
						style={{
						borderRadius: '12px',
						}}
						className='flex flex-col overflow-hidden border border-zinc-950/10 bg-white dark:border-zinc-50/10 dark:bg-zinc-900'
					>
						<img
						src='/IMG_0746.jpg'
						alt='Ghost in the shell - Kôkaku kidôtai'
						className='h-80 w-full object-cover'
						/>
					</div>
					</Tilt>
					<Tilt rotationFactor={8} isRevese>
					<div
						style={{
						borderRadius: '12px',
						}}
						className='flex flex-col overflow-hidden border border-zinc-950/10 bg-white dark:border-zinc-50/10 dark:bg-zinc-900'
					>
						<img
						src='/IMG_0745.jpg'
						alt='Ghost in the shell - Kôkaku kidôtai'
						className='h-80 w-full object-cover'
						/>
					</div>
					</Tilt>
					<Tilt rotationFactor={8} isRevese>
					<div id="test"
						style={{
						borderRadius: '12px',
						}}
						className='flex flex-col overflow-hidden border border-zinc-950/10 bg-white dark:border-zinc-50/10 dark:bg-zinc-900'
					>
						<img
						src='/IMG_0747.jpg'
						alt='Ghost in the shell - Kôkaku kidôtai'
						className='h-80 w-full object-cover'
						/>
					</div>
					</Tilt>
				</div> 
			</div> */}
			<div className="relative w-11/12 md:w-2/3 mx-auto mb-20">
			<HeroVideoDialog
				className="block"
				animationStyle="from-center"
				videoSrc="/video.mp4"
				thumbnailSrc="/IMG_0747.jpg"
				thumbnailAlt="Hero Video"
			/>
			</div>
			<FAQ />
			<div className="w-full px-20 border-t grid grid-cols-1 md:grid-cols-2 p-8 gap-3">
				<div className="w-full flex justify-center md:justify-start items-center gap-1">
					<FaInstagram className="size-5" />
					<Link href={"https://www.instagram.com/tropi.tech?igsh=MXJnazQ5bXA0ejNxdA=="} className="text-lg font-medium hover:underline">Tropitech</Link>
				</div>
				<div className="w-full flex flex-col md:flex-row justify-center md:justify-end items-center gap-3 md:gap-10">
					<Link href={"/cgu"} className="text-lg font-medium hover:underline">CGU</Link>
					<Link href={"/pc"} className="text-lg font-medium hover:underline">Politique de Confidentialité</Link>
				</div>
			</div>
		</>
	);
}
