"use client"

import { motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Définition du type pour un élément de navigation
type TabItem = {
  id: number;
  tile: string;
  href: string;
};

// Définition des props pour le composant
type AnimatedNavigationTabsProps = {
  items: TabItem[];
};

export function AnimatedNavigationTabs({ items }: AnimatedNavigationTabsProps) {
  // Ici, active et isHover seront de type TabItem
  const [active, setActive] = useState<TabItem>(items[0]);
  const [isHover, setIsHover] = useState<TabItem | null>(null);

  return (
    <main className="absolute z-10 w-full h-auto flex items-start md:items-center justify-center px-4 py-6">
      <div className="relative">
        <ul className="flex items-center justify-center">
          {items.map((item) => (
            <button
              key={item.id}
              className={cn(
                "py-2 relative duration-300 transition-colors hover:!text-primary",
                active.id === item.id ? "text-primary" : "text-muted-foreground"
              )}
              onClick={() => setActive(item)}
              onMouseEnter={() => setIsHover(item)}
              onMouseLeave={() => setIsHover(null)}
            >
              <a href={item.href} className="px-5 py-2 relative">
                {item.tile}
                {isHover?.id === item.id && (
                  <motion.div
                    layoutId="hover-bg"
                    className="absolute bottom-0 left-0 right-0 w-full h-full bg-primary/10"
                    style={{ borderRadius: 6 }}
                  />
                )}
              </a>
              {active.id === item.id && (
                <motion.div
                  layoutId="active"
                  className="absolute bottom-0 left-0 right-0 w-full h-0.5 bg-primary"
                />
              )}
              {isHover?.id === item.id && (
                <motion.div
                  layoutId="hover"
                  className="absolute bottom-0 left-0 right-0 w-full h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </ul>
      </div>
    </main>
  );
}
