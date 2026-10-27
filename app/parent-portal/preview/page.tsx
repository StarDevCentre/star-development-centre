import {ParentExperiencePreview} from "../../../components/ParentExperiencePreview";
import "./preview.css";
import "./design-studio.css";
import "./pitch-profile.css";

export const metadata={title:"Your STAR · Parent experience preview",description:"Explore a sample STAR family space: sessions, player development, coaching moments and support for parents.",robots:{index:false,follow:false}};
export const viewport={themeColor:"#071120"};
export default function Page(){return <ParentExperiencePreview/>;}
