"use client";
import Link from "next/link";
import {createContext, useContext, useEffect, useState, type ReactNode} from "react";
import type {Session} from "@supabase/supabase-js";
import {supabaseBrowser} from "../lib/supabaseBrowser";

type Price = {slug: string; title: string; price: string; unit: string; options: string[]};
type Pricing = {status: "checking" | "signed-out" | "loading" | "ready" | "error"; prices: Price[]; retry: () => void; returnTo: "programmes" | "finder"};
const PricingContext = createContext<Pricing>({status: "checking", prices: [], retry: () => {}, returnTo: "programmes"});

export function ProgrammePricingProvider({children, returnTo = "programmes"}: {children: ReactNode; returnTo?: "programmes" | "finder"}) {
  const [state, setState] = useState<Pick<Pricing, "status" | "prices">>({status: "checking", prices: []});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const supabase = supabaseBrowser;
    if (!supabase) {setState({status: "signed-out", prices: []}); return;}
    let active = true, revision = 0;
    let controller: AbortController | undefined;
    async function load(session: Session | null) {
      const current = ++revision;
      controller?.abort();
      if (!active) return;
      if (!session || session.user.is_anonymous) {setState({status: "signed-out", prices: []}); return;}
      const requestController = new AbortController(); controller = requestController;
      setState({status: "loading", prices: []});
      try {
        const response = await fetch("/api/programme-prices", {headers: {Authorization: "Bearer " + session.access_token}, cache: "no-store", signal: requestController.signal});
        if (!active || current !== revision) return;
        if (response.status === 401) {setState({status: "signed-out", prices: []}); return;}
        if (!response.ok) throw Error();
        const data = await response.json();
        if (active && current === revision) setState({status: "ready", prices: data.prices});
      } catch {if (active && current === revision && !requestController.signal.aborted) setState({status: "error", prices: []});}
    }
    // INITIAL_SESSION and later sign-in/sign-out events share the same cancellation path.
    const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {void load(session);});
    return () => {active = false; revision++; controller?.abort(); subscription.unsubscribe();};
  }, [attempt]);
  return <PricingContext.Provider value={{...state, retry: () => setAttempt(n => n + 1), returnTo}}>{children}</PricingContext.Provider>;
}

export function ProgrammePrice({slug}: {slug: string}) {
  const {status, prices, retry, returnTo} = useContext(PricingContext);
  const price = prices.find(p => p.slug === slug);
  if (status === "checking" || status === "loading") return <div className="programme-price" role="status">Checking prices…</div>;
  if (status === "signed-out") return <div className="programme-price programme-price-locked"><Link href={"/parent-portal?returnTo=" + returnTo + "#parent-account"}>Sign in to view prices <span aria-hidden="true">→</span></Link></div>;
  if (status === "error") return <div className="programme-price" role="status">Prices could not be loaded. <button type="button" onClick={retry}>Try again</button></div>;
  if (!price) return <div className="programme-price">Contact STAR for pricing details.</div>;
  return <div className="programme-price"><p><strong>{price.price}</strong> <span>{price.unit}</span></p><details><summary>Payment details <span aria-hidden="true">+</span></summary><ul>{price.options.map(option => <li key={option}>{option}</li>)}</ul></details></div>;
}
