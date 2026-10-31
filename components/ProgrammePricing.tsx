"use client";
import {createContext, useContext, type ReactNode} from "react";

type Price = {slug: string; title: string; price: string; unit: string; options: string[]};
const prices: Price[] = [
  {slug:"sparks",title:"STAR Sparks",price:"£5",unit:"per 45-minute session",options:["Pay as you go."]},
  {slug:"development",title:"Development Groups",price:"£5",unit:"per 45-minute session",options:["Pay as you go."]},
  {slug:"one-to-one",title:"One to One Coaching",price:"£35",unit:"per 60-minute session",options:["Pay per session. No full programme commitment."]},
  {slug:"flyers",title:"STAR Flyers",price:"£375",unit:"upfront · 16 weeks",options:["Or three payments totalling £380."]},
  {slug:"prestige",title:"STAR Prestige",price:"£800",unit:"upfront · 24 weeks",options:["Or 3 payments of £280 (£840 total).","Or 6 payments of £150 (£900 total)."]},
  {slug:"season-support",title:"Player Season Support",price:"£25",unit:"per visit",options:["Family or club may pay. Visits arranged individually."]}
];
const PricingContext = createContext(prices);
export function ProgrammePricingProvider({children}: {children: ReactNode; returnTo?: "programmes" | "finder"}) {
  return <PricingContext.Provider value={prices}>{children}</PricingContext.Provider>;
}
export function ProgrammePrice({slug}: {slug: string}) {
  const price = useContext(PricingContext).find(p => p.slug === slug);
  if (!price) return null;
  return <div className="programme-price"><p><strong>{price.price}</strong> <span>{price.unit}</span></p><details><summary>Payment details <span aria-hidden="true">+</span></summary><ul>{price.options.map(option => <li key={option}>{option}</li>)}</ul></details></div>;
}
