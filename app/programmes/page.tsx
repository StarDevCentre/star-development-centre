import {pageMetadata} from '../../lib/siteMetadata';
import type {Metadata} from "next";
import ProgrammeExplorer from "../../components/ProgrammeExplorer";
import "../home.css";
import "./programmes.css";
const description = "Explore One to One Coaching, STAR Flyers, Prestige and age-group football sessions for girls aged 5–18 in Taunton, Bridgwater and Wellington. Find coaching that fits the player.";
export const metadata: Metadata = pageMetadata('/programmes');
export default function Programmes() {return <ProgrammeExplorer/>;}
