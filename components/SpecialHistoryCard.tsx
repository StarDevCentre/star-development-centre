import Image from "next/image";
import "./special-history-card.css";

export function SpecialHistoryCard({
  artwork,
  face,
  sizes = "(max-width: 560px) 88vw, 420px",
  decorative = false,
}: {
  artwork:{slug:string;front:string;back:string};
  face:"front"|"back";
  sizes?:string;
  decorative?:boolean;
}) {
  return <Image
    src={`/player-space/history/specials/${artwork.slug}-${face}.webp`}
    width={800}
    height={1200}
    sizes={sizes}
    alt={decorative ? "" : artwork[face]}
  />;
}
