"use client"

import NavBar from "@/components/lp/nav";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { motion } from "framer-motion";

export default function Home() {
	return (
		<>
			<NavBar />
			<HeroGeometric badge="Soirée Tech" title1="" title2="Tropitech" />
			<div className="w-full h-auto flex flex-col justify-center items-center gap-5">
				
			</div>
		</>
	);
}
