import type {Metadata} from "next";
import {JourneyGame} from "../../../components/JourneyGame";
export const metadata:Metadata={title:"STAR: The Journey — Playable Prototype",robots:{index:false,follow:false}};
export default function Page(){return <JourneyGame/>}