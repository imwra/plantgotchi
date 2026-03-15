import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plantgotchi - Smart Plant Monitoring with Retro Soul",
  description:
    "Stick it in soil. Connect to WiFi. Watch your plants thrive. Smart plant sensors with a Tamagotchi-inspired app experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-cream text-pixel-black antialiased">{children}</body>
    </html>
  );
}
