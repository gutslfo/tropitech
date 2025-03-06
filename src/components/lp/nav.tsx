import { Button } from "../ui/button";
import { AnimatedNavigationTabs } from "../ui/animated-navigation-tabs";
import { div } from "framer-motion/client";

export default function NavBar() {
	const items = [
  { id: 1, tile: "Info" },
  { id: 2, tile: "Line up" },
  { id: 3, tile: "Tarifs" },
];
	return (
		<div className="w-auto h-auto p-0 bg-black/50">
			<AnimatedNavigationTabs items={items} />
		</div>
	);
}