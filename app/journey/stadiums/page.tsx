import type {Metadata} from "next";
import {JourneyStadiumCollection} from "../../../components/JourneyStadiumCollection";
export const metadata:Metadata={title:"Stadium Collection Concept | STAR: The Journey",robots:{index:false,follow:false}};
export default function Page(){return <main style={{background:"#06142e",color:"#fff9e9",minHeight:"100vh",padding:"clamp(18px,4vw,48px)"}}><div style={{maxWidth:1100,margin:"0 auto"}}><p style={{fontWeight:800,color:"#e5c476"}}>STAR: THE JOURNEY · DEVELOPMENT CONCEPT</p><JourneyStadiumCollection/></div></main>}