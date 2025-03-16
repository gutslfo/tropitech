import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
  } from "@/components/ui/accordion"
import { Tilt } from "../ui/tilt"
import Image from "next/image"

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
	<div id="faq" className="w-11/12 md:w-2/3 mx-auto flex justify-center items-center gap-5 mb-44">
	  <Accordion type="single" collapsible className="w-full">
		<AccordionItem value="item-1">
		  <AccordionTrigger className="text-xl">Est-ce facile d'accès ?</AccordionTrigger>
		  <AccordionContent className="ml-5 text-lg my-2">
			Oui, c'est à 3min à pied de la gare de Coppet.
		  </AccordionContent>
		</AccordionItem>
		<AccordionItem value="item-2">
		  <AccordionTrigger className="text-xl">Qu'est-ce que Tropitech ?</AccordionTrigger>
		  <AccordionContent className="ml-5 text-lg my-2">
			TropiTech est une expérience immersive mêlant musique électronique et scénographie tropicale dans un cadre atypique.<br/><br/>Organisée dans les Caves du Château de Coppet, cette soirée propose un voyage sonore évolutif, de la house à la techno, porté par des artistes émergents et underground.<br/><br/>L’objectif : créer une atmosphère unique où la fête prend une dimension sensorielle, entre basses vibrantes et décor exotique.
		  </AccordionContent>
		</AccordionItem>
		<AccordionItem value="item-3">
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
										width={300}
										height={300}
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
	  </Accordion>
	  </div>
	)
  }
  