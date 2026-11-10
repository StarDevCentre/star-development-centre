import Image from "next/image";
import "./afghanistan-history-card.css";

const art = "/player-space/history/specials/afghanistan-women.webp";

export function AfghanistanHistoryArt({sizes}: {sizes:string}) {
  return <Image src={art} width={800} height={1000} sizes={sizes} alt="Illustration of five Afghan women footballers standing shoulder to shoulder on a pitch"/>;
}

export function AfghanistanHistoryCard({face}: {face:"front"|"back"}) {
  return <div className={`ps-afghanistan-card ps-afghanistan-${face}`}>
    <div className="ps-afghanistan-card-heading">
      <span>Special edition <b>SE01</b></span>
      <Image src="/star-icon.png" width={96} height={96} alt="STAR Development Centre" unoptimized/>
    </div>
    {face==="front" ? <>
      <div className="ps-afghanistan-art"><AfghanistanHistoryArt sizes="(max-width: 560px) 88vw, 420px"/></div>
      <div className="ps-afghanistan-title">
        <span>Football in exile</span>
        <strong>Afghanistan Women’s National Team</strong>
      </div>
    </> : <div className="ps-afghanistan-account">
      <strong>Football in exile</strong>
      <dl>
        <dt>2021</dt><dd>As the Taliban returned to power, members of the Afghan women’s national team were among the players evacuated from Afghanistan.</dd>
        <dt>2022</dt><dd>Players returned to training together in Melbourne and played in local competition with Melbourne Victory’s support.</dd>
        <dt>2026</dt><dd>After years of advocacy, FIFA changed its rules to allow Afghan women to represent their country in official international matches.</dd>
      </dl>
    </div>}
    <div className="ps-afghanistan-credit">{face==="front"?"Commemorative illustration":"Afghanistan Women’s National Team"}</div>
  </div>;
}
