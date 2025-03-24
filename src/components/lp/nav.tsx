import { AnimatedNavigationTabs } from "../ui/animated-navigation-tabs";

export default function NavBar() {
	const items = [
  { id: 1, tile: "Info", href: "#info" },
  { id: 2, tile: "Tarifs", href: "#tarifs" },
  { id: 3, tile: "FAQ", href: "#faq" },
];
	return (
		<div className="w-auto h-auto p-0 bg-black/50">
			<AnimatedNavigationTabs items={items} />
		</div>
	);
}