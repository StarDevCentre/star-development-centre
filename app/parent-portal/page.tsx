import {ParentPortal} from "../../components/ParentPortal";
import {programmes} from "../../lib/siteData";
import "../home.css";
import "./parent.css";
export const metadata={title:"Parent Account & Player Registration",description:"Create your STAR parent account, register your player and follow her football development.",robots:{index:false,follow:true}};
export default async function Page({searchParams}:{searchParams:Promise<{mode?:string;programme?:string}>}){
 const params=await searchParams;
 const initialMode=params.mode==="signup"?"signup":params.mode==="reset"?"reset":"login";
 const initialProgramme=programmes.some(p=>p.slug===params.programme)?params.programme||"":"";
 return <div className="parent-page"><section className="parent-intro home-width"><div><p className="parent-eyebrow">STAR / FOR PARENTS & GUARDIANS</p><h1>Her football.<br/><span>Your connection.</span></h1><p>One place to begin her STAR journey and stay involved as she develops.</p></div><LinkBack/></section><section className="parent-content home-width"><ParentPortal initialMode={initialMode} initialProgramme={initialProgramme}/></section></div>;
}
function LinkBack(){return <a className="parent-back-link" href="/programmes">← Explore our programmes</a>}
