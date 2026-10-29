import {programmeSignInReturn} from "../../lib/programmeOptions";
import {ParentPortal} from "../../components/ParentPortal";
import {programmes} from "../../lib/siteData";
import {ParentMobileHeader} from "../../components/ParentAppChrome";
import "../home.css";
import "./parent.css";
export const metadata={title:"Parent Portal & Player Registration",description:"Register your player, view shared sessions and coaching progress, and stay in touch with STAR from your parent account.",robots:{index:false,follow:true}};
export default async function Page({searchParams}:{searchParams:Promise<{mode?:string;programme?:string;returnTo?:string}>}){
 const params=await searchParams;
 const returnTo=programmeSignInReturn(params.returnTo);
 const initialMode=params.mode==="signup"?"signup":params.mode==="reset"?"reset":"login";
 const initialProgramme=programmes.some(p=>p.slug===params.programme)?params.programme||"":"";
 return <div className="parent-page"><ParentMobileHeader entry/><section className="parent-intro home-width"><div><p className="parent-eyebrow">STAR / FOR PARENTS & GUARDIANS</p><h1>Her football.<br/><span>Your connection.</span></h1><p>One place to begin her STAR journey and stay involved as she develops.</p></div><LinkBack/></section><section className="parent-content home-width"><ParentPortal initialMode={initialMode} initialProgramme={initialProgramme} returnTo={returnTo}/></section></div>;
}
function LinkBack(){return <a className="parent-back-link" href="/programmes">← Explore our programmes</a>}

