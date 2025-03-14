import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
  } from "@/components/ui/accordion"
import { Tilt } from "../ui/tilt"
  
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
		  <AccordionTrigger className="text-xl">Quelles sont les styles musicaux ?</AccordionTrigger>
		  <AccordionContent className="ml-5 text-lg my-2">
			Tech sa grand-mère
		  </AccordionContent>
		</AccordionItem>
		<AccordionItem value="item-3">
		  <AccordionTrigger className="text-xl">À quoi ressemble l'événement ?</AccordionTrigger>
		  <AccordionContent className="ml-5 text-lg my-2">
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
		  </AccordionContent>
		</AccordionItem>
	  </Accordion>
	  </div>
	)
  }
  