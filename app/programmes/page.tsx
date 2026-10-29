import type {Metadata} from "next";
import ProgrammeExplorer from "../../components/ProgrammeExplorer";
import "../home.css";
import "./programmes.css";
const description = "Explore One to One Coaching, STAR Flyers, Prestige and age-group football sessions for girls aged 5–18 in Taunton and Wellington. Find coaching that fits the player.";
export const metadata: Metadata = {
  title: "Girls’ Football Coaching Programmes in Somerset", description,
  alternates: {canonical: "https://star-development-centre.vercel.app/programmes"},
  openGraph: {title: "Your game. Your next step. | STAR Programmes", description, url: "https://star-development-centre.vercel.app/programmes", type: "website", images: [{url: "https://star-development-centre.vercel.app/images/star-player-individual.webp", width: 850, height: 1366, alt: "STAR player at a football pitch"}]}
};
export default function Programmes() {return <ProgrammeExplorer/>;}
