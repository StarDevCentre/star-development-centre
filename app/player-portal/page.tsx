import { PlayerTrophyPortal } from "../../components/PlayerTrophyPortal";

export const metadata = { title: "Player Portal | STAR Development Centre", description: "Celebrate your STAR achievements in your personal trophy cabinet, with approved family access." };

export default function PlayerPortal() {
  return <><div className="inner-hero star-enquiry-hero"><div className="container"><div className="kicker light">STAR DEVELOPMENT CENTRE / PLAYERS</div><h1>PLAYER<br/><em>PORTAL.</em></h1><p>Your development journey, all in one place.</p></div></div><section className="star-enquiry-section"><div className="container"><PlayerTrophyPortal/></div></section></>;
}
