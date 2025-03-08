import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tropitech",
  description: "Soirée techno tropicale",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="dark bg-black">
        {children}
      </body>
    </html>
  );
}
