import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "STAR Development Centre | Girls' Football Development", description: "Independent girls' football development in Somerset. Discover STAR programmes, pathways and coaching." };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
