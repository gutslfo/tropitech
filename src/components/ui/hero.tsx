"use client";

import { motion } from "framer-motion";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import localFont from "next/font/local";
import Image from "next/image";

const barbara = localFont({
  src: "../../../fonts/barbra/Barbra-Regular.otf",
  variable: "--font-barbara",
  display: "swap",
});

function TropicalShape({
  className,
  delay = 0,
  width = 400,
  height = 150,
  rotate = 0,
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -150,
        rotate: rotate - 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{ y: [0, 30, 0] }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{ width, height }}
        className="relative"
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="tropicalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#141811" />
              <stop offset="50%" stopColor="#1B371C" />
              <stop offset="100%" stopColor="#304931" />
            </linearGradient>
          </defs>
          <path
            d="M100 10
               C 40 30, 20 90, 30 150
               C 40 210, 80 260, 100 290
               C 120 260, 160 210, 170 150
               C 180 90, 160 30, 100 10
               Z"
            fill="url(#tropicalGradient)"
            className="shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

function HeroGeometric2({
  badge = "Design Collective",
  title1 = "Elevate Your Digital Vision",
  title2 = "Crafting Exceptional Websites",
}: {
  badge?: string;
  title1?: string;
  title2?: string;
}) {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      {/* 
        Conteneur de l'image de fond avec dégradé sur les bords.
        On positionne ce bloc derrière les feuilles en lui donnant un z-index plus faible.
      */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
        <div className="relative">
          <Image
            src="/logo.jpg"
            alt="Logo"
            width={400}
            height={400}
            className="rounded-full opacity-30 filter brightness-90"
          />
          {/* Dégradé radial pour assombrir les bords */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, transparent 1%, black 100%)" }}
          />
        </div>
      </div>

      {/* Feuilles (formes tropicales) placées au-dessus de l'image */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 2 }}>
        <TropicalShape
          delay={0.3}
          width={600}
          height={180}
          rotate={20}
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />

        <TropicalShape
          delay={0.5}
          width={500}
          height={150}
          rotate={-15}
          className="right-0 top-[65%] md:top-[75%]"
        />

        <TropicalShape
          delay={0.4}
          width={300}
          height={120}
          rotate={-8}
          className="left-[20%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />

        <TropicalShape
          delay={0.6}
          width={200}
          height={100}
          rotate={20}
          className="right-[25%] md:right-[20%] top-[5%] md:top-[15%]"
        />

        <TropicalShape
          delay={0.7}
          width={150}
          height={80}
          rotate={-25}
          className="left-[10%] md:left-[25%] top-[12%] md:top-[10%]"
        />

		<TropicalShape
          delay={0.7}
          width={300}
          height={120}
          rotate={30}
          className="left-[80%] top-[35%] hidden md:block"
        />

      </div>

      {/* Contenu principal */}
      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="hidden items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 md:mb-12"
          >
            <Circle className="h-2 w-2 fill-[#1FFF44]" />
            <span className="text-sm text-white/60 tracking-wide">
              {badge}
            </span>
          </motion.div>

          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
			className="mt-32"
          >
            <h1 className="text-[60px] md:text-8xl font-bold mb-6 md:mb-8 tracking-tight">
              <span
                className={cn(
                  "bg-clip-text text-transparent bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-600",
                  barbara.className
                )}
              >
                {title2}
              </span>
            </h1>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-base sm:text-lg md:text-xl text-white/40 mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
			
            </p>
          </motion.div>
        </div>
      </div>

      {/* Optionnel : Overlay de dégradé global (si besoin) */}
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-black"
        style={{ zIndex: 3 }}
      />
    </div>
  );
}

export { HeroGeometric2 };
