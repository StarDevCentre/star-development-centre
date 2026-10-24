"use client";
import {useEffect,useRef,useState} from "react";
export function Reveal({children,className=""}:{children:React.ReactNode,className?:string}){const el=useRef<HTMLDivElement>(null);const [shown,setShown]=useState(false);useEffect(()=>{if(!el.current)return;const obs=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setShown(true);obs.disconnect()}},{threshold:.1});obs.observe(el.current);return()=>obs.disconnect()},[]);return <div ref={el} className={"reveal "+(shown?"shown ":"")+className}>{children}</div>}
