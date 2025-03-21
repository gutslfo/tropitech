import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
  } from "@/components/ui/accordion"
import { Tilt } from "../ui/tilt"
import Image from "next/image"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { AiFillSpotify } from "react-icons/ai";
import { FaSoundcloud } from "react-icons/fa6";
import { FaInstagram } from "react-icons/fa";

const imgs = [
	{id: 1, src: "/images/1.jpg"},
	{id: 2, src: "/images/2.jpg"},
	{id: 3, src: "/images/3.jpg"},
	{id: 4, src: "/images/4.jpg"},
	{id: 5, src: "/images/5.jpg"},
	{id: 6, src: "/images/6.jpg"},
	{id: 7, src: "/images/7.jpg"},
	{id: 8, src: "/images/8.jpg"},
	{id: 9, src: "/images/9.jpg"}
]
  
  export function FAQ() {
	return (
	<div id="faq" className="w-11/12 md:w-2/3 mx-auto flex justify-center items-center gap-5 mb-24 md:mb-36">
	  <Accordion type="single" collapsible className="w-full">
		<AccordionItem value="item-1">
		  <AccordionTrigger className="text-xl">Qu'est-ce que Tropitech ?</AccordionTrigger>
		  <AccordionContent className="ml-5 text-lg my-2">
			Tropitech est une expérience immersive mêlant musique électronique et scénographie tropicale dans un cadre atypique.<br/><br/>Organisée dans les Caves du Château de Coppet, cette soirée propose un voyage sonore évolutif, de la house à la techno, porté par des artistes émergents et underground.<br/><br/>L’objectif : créer une atmosphère unique où la fête prend une dimension sensorielle, entre basses vibrantes et décor exotique.
		  </AccordionContent>
		</AccordionItem>
		<AccordionItem value="item-2">
		  <AccordionTrigger className="text-xl">À quoi ressemble l'événement ?</AccordionTrigger>
		  <AccordionContent className="ml-5 text-lg my-2">
			<div className="w-full grid grid-cols-1 md:grid-cols-3 place-items-center place-content-between gap-5">
								{/* <Tilt rotationFactor={8} isRevese>
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
								</Tilt> */}
								{imgs.map((img) => (
									<Tilt key={img.id} rotationFactor={8} isRevese>
									<div
										style={{
										borderRadius: '12px',
										}}
										className='flex flex-col overflow-hidden border border-zinc-950/10 bg-white dark:border-zinc-50/10 dark:bg-zinc-900'
									>
										<Image
										width={1000}
										height={1000}
										src={img.src}
										alt='Image Tropitech'
										className='h-80 w-full object-cover'
										/>
									</div>
									</Tilt>
								))}
							</div>
		  </AccordionContent>
		</AccordionItem>
		<AccordionItem value="item-3">
		  <AccordionTrigger className="text-xl">Est-ce facile d'accès ? Y a t-il des trains toute la nuit?</AccordionTrigger>
		  <AccordionContent className="ml-5 text-lg my-2">
			L'événement a lieu a 3 min à pied de la gare de Coppet.<br/><br/> Des trains en direction de Genève et de Lausanne circulent toute la nuit.<br/><br/>Lien Google Maps :<br/><span className="block h-2" /><Link href={"https://maps.app.goo.gl/7D6145TF1Q7NVCnB6"} className="underline underline-offset-2 flex justify-start items-center gap-2 duration-150 hover:text-foreground/80"><ExternalLink className="size-5" />Caves du Château, Rue du Greny</Link>
		  </AccordionContent>
		</AccordionItem>
		<AccordionItem value="item-4">
		  <AccordionTrigger className="text-xl">Y aura-t-il de quoi se restaurer sur place ?</AccordionTrigger>
		  <AccordionContent className="ml-5 text-lg my-2">
			Oui, un bar et de la nourriture seront ouverts tout au long de la soirée.<br/><br/> Vous pourrez découvrir les burgers à base de poulet frit et snacks savoureux de Los Pollos Hermanos, parfaits pour une pause gourmande sans quitter l’ambiance.<br/><br/> Pour accompagner le tout, Mes Pépites proposera une sélection de vins soigneusement choisis par un sommelier, tandis que les bières de la Nébuleuse et les matés El Tony vous apporteront fraîcheur et énergie!
		  </AccordionContent>
		</AccordionItem>
		<AccordionItem value="item-5">
		  <AccordionTrigger className="text-xl">Où retrouver les artistes ?</AccordionTrigger>
		  <AccordionContent className="ml-5 text-lg my-2">
			Edo :<br/><span className="block h-2" /><Link href={"https://soundcloud.com/edoardo-failla-545458741/lets-just-grab-one-beer?si=673fc458937547f6970f6526dd820328&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"} className="underline underline-offset-2 flex justify-start items-center gap-2 duration-150 hover:text-foreground/80"><FaSoundcloud className="size-5" />Soundcloud</Link>
			<br/>
			EREIB :<br/><span className="block h-2" /><Link href={"https://soundcloud.com/lakesidebasement/basement-podcast-x-introspective-ereib?in=ereib/sets/podcasts&si=62b33d65021b4055a126d7a7915a0055&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"} className="underline underline-offset-2 flex justify-start items-center gap-2 duration-150 hover:text-foreground/80"><FaSoundcloud className="size-5" />Soundcloud</Link>
			<Link href={"https://open.spotify.com/intl-fr/artist/1cCaSfo9CEmb8a3Le0NCqo?si=BpcMUiAPQrud8xXco_DbXw"} className="underline underline-offset-2 flex justify-start items-center gap-2 duration-150 hover:text-foreground/80"><AiFillSpotify className="size-5" />Spotify</Link>
			<Link href={"https://www.instagram.com/ereib_?igsh=MTFpNmRrdzFzY2ptZg=="} className="underline underline-offset-2 flex justify-start items-center gap-2 duration-150 hover:text-foreground/80"><FaInstagram className="size-5" />Instagram</Link>
			<br/>
			Cadence :<br/><span className="block h-2" /><Link href={"https://soundcloud.com/mitsu2000/mitsucast-067-cadence?in=cadence_live/sets/mixes&si=04948642d6804029a927ce8e691f687d&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"} className="underline underline-offset-2 flex justify-start items-center gap-2 duration-150 hover:text-foreground/80"><FaSoundcloud className="size-5" />Soundcloud</Link>
			<Link href={"https://open.spotify.com/intl-fr/artist/1y4Zrf8tJQFH412BRpv3U3?si=atl-OlheRNqjah7AtFBNiA"} className="underline underline-offset-2 flex justify-start items-center gap-2 duration-150 hover:text-foreground/80"><AiFillSpotify className="size-5" />Spotify</Link>
			<Link href={"https://www.instagram.com/cadence_live?igsh=YzA2bGNid3ptN2Rv"} className="underline underline-offset-2 flex justify-start items-center gap-2 duration-150 hover:text-foreground/80"><FaInstagram className="size-5" />Instagram</Link>
		    <br/>
			Götz :<br/><span className="block h-2" /><Link href={"https://soundcloud.com/gotzzzz/immersion?si=3b328cbb8c8541dea670dffda265ad90&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"} className="underline underline-offset-2 flex justify-start items-center gap-2 duration-150 hover:text-foreground/80"><FaSoundcloud className="size-5" />Soundcloud</Link>
			<Link href={"https://www.instagram.com/pierrtran_?igsh=MjNqeG5qZ2JjM2U%3D&utm_source=qr"} className="underline underline-offset-2 flex justify-start items-center gap-2 duration-150 hover:text-foreground/80"><FaInstagram className="size-5" />Instagram</Link>
			<br/>
			Venuss :<br/><span className="block h-2" /><Link href={"https://soundcloud.com/user-875894149/venuss-1-home-set_1024?si=cdb8cc00a0da417eb3e03d3daf4bdc1e&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"} className="underline underline-offset-2 flex justify-start items-center gap-2 duration-150 hover:text-foreground/80"><FaSoundcloud className="size-5" />Soundcloud</Link>
			<Link href={"https://www.instagram.com/__5venuss._?igsh=bjNreDZveXY0eWpw"} className="underline underline-offset-2 flex justify-start items-center gap-2 duration-150 hover:text-foreground/80"><FaInstagram className="size-5" />Instagram</Link>
		  </AccordionContent>
		</AccordionItem>
	  </Accordion>
	  </div>
	)
  }
  