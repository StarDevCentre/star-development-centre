import { PlayerSpaceDemo } from "../../../components/PlayerSpaceDemo";
import "../player-space.css";
export const dynamic = "force-dynamic";

export const metadata = { title: "Explore Player Space", description: "Explore a sample STAR Player Space, with training challenges, personal goals and a trophy cabinet.", robots: { index: false, follow: false } };
export default function PlayerSpacePreview() { return <PlayerSpaceDemo/>; }
