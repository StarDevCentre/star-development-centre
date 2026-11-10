import Image from "next/image";
import "./afghanistan-history-card.css";

const art = "/player-space/history/specials/afghanistan-women.webp";

export function AfghanistanHistoryArt({sizes}: {sizes:string}) {
  return <Image src={art} width={800} height={1000} sizes={sizes} alt="Illustration of five Afghan women footballers standing shoulder to shoulder on a pitch"/>;
}

const faceText = {
  front: "STAR Development Centre special edition SE01. Afghanistan Women’s National Team. Football in exile. Illustrated portrait of five Afghan women footballers.",
  back: "STAR Development Centre special edition SE01. Football in exile. 2021. After the Taliban returned to power, players were evacuated from Afghanistan. 2022. The team returned to football in Melbourne. 2026. A FIFA rule change opened the way to official international matches.",
};

export function AfghanistanHistoryCard({
  face,
  sizes = "(max-width: 560px) 88vw, 420px",
}: {
  face:"front"|"back";
  sizes?:string;
}) {
  return <Image
    src={`/player-space/history/specials/afghanistan-se01-${face}.webp`}
    width={800}
    height={1200}
    sizes={sizes}
    alt={faceText[face]}
  />;
}
