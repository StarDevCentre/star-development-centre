"use client";
type Player={first_name:string;last_name:string;programme:string};
type Assessment={id:string;assessed_on:string;category:string;rating:number;strength:string;development_area:string;action_plan:string};
type Goal={id:string;goal:string;status:string};
type Review={id:string;review_month:string;strengths:string;development_areas:string;next_steps:string};
const categories=["Technical","Tactical","Physical","Psychological","Social"];
const palette=["#2459a6","#c46d12","#13836c","#8b4eb5","#ba345f"];
const dateLabel=(value:string)=>new Date(value+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
export function IDPProgressReport({player,assessments,goals,reviews}:{player:Player;assessments:Assessment[];goals:Goal[];reviews:Review[]}){
 const dates=Array.from(new Set(assessments.map(a=>a.assessed_on))).sort().slice(-12);
 const width=640,height=245,left=46,right=18,top=16,bottom=44,plotW=width-left-right,plotH=height-top-bottom;
 const x=(i:number)=>left+(dates.length===1?plotW/2:i*plotW/(dates.length-1));
 const y=(v:number)=>top+(5-v)*plotH/4;
 const latest=categories.map(c=>({category:c,assessment:assessments.filter(a=>a.category===c).sort((a,b)=>b.assessed_on.localeCompare(a.assessed_on))[0]}));
 const latestReview=[...reviews].sort((a,b)=>b.review_month.localeCompare(a.review_month))[0];
 const reportDate=new Date().toLocaleDateString("en-GB",{dateStyle:"long"});
 return <div className="star-idp-report-wrap">
 <section className="star-idp-report" aria-label="Player progress and printable report">
 <div className="star-idp-report-header"><div><span className="kicker">STAR DEVELOPMENT CENTRE</span><h4>Player development progress report</h4><p>{player.first_name} {player.last_name} · {player.programme}</p></div><p>Prepared {reportDate}</p></div>
 <h5>Assessment progress over time</h5><p>Coach-rated football development on a 1–5 scale. Points show assessments recorded on each date; gaps mean no assessment was made. These are coaching observations, not standardised tests.</p>
 {dates.length?<div className="star-idp-chart-scroll"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Line chart showing assessed player development categories over time" className="star-idp-chart">
 {[1,2,3,4,5].map(n=><g key={n}><line x1={left} y1={y(n)} x2={width-right} y2={y(n)} stroke="#b8c6d8" strokeDasharray="3 4"/><text x={left-10} y={y(n)+4} textAnchor="end" fontSize="12" fill="#34495e">{n}</text></g>)}
 {dates.map((d,i)=><text key={d} x={x(i)} y={height-15} textAnchor="middle" fontSize="10" fill="#34495e">{new Date(d+"T12:00:00").toLocaleDateString("en-GB",{month:"short",year:"2-digit"})}</text>)}
 {categories.map((cat,ci)=>{const pts=dates.map((d,i)=>{const records=assessments.filter(a=>a.category===cat&&a.assessed_on===d);const a=records[records.length-1];return a?{x:x(i),y:y(a.rating),rating:a.rating,date:d}:null}).filter((v):v is {x:number;y:number;rating:number;date:string}=>v!==null);return <g key={cat}>{pts.length>1&&<polyline points={pts.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke={palette[ci]} strokeWidth="2.5"/>}{pts.map(p=><circle key={p.date} cx={p.x} cy={p.y} r="4.5" fill={palette[ci]} stroke="#fff" strokeWidth="1.5"><title>{cat}: {p.rating}/5 on {dateLabel(p.date)}</title></circle>)}</g>})}
 </svg></div>:<p>No assessments recorded yet. Add assessments to see progress over time.</p>}
 <div className="star-idp-legend">{categories.map((cat,i)=><span key={cat}><i style={{backgroundColor:palette[i]}}/>{cat}</span>)}</div>
 <h5>Latest assessment by area</h5><div className="star-idp-report-grid">{latest.map(({category,assessment})=><div key={category} className="star-idp-report-card"><strong>{category}</strong>{assessment?<><p><b>{assessment.rating}/5</b> · {dateLabel(assessment.assessed_on)}</p><p><b>Strength:</b> {assessment.strength}</p><p><b>Focus:</b> {assessment.development_area}</p><p><b>Action:</b> {assessment.action_plan}</p></>:<p>Not assessed</p>}</div>)}</div>
 <h5>Development goals</h5>{goals.length?goals.map(g=><p key={g.id}><strong>{g.status==="achieved"?"Achieved":"Working on"}:</strong> {g.goal}</p>):<p>No goals recorded.</p>}
 <h5>Latest monthly coaching review</h5>{latestReview?<div><p><strong>{new Date(latestReview.review_month+"T12:00:00").toLocaleDateString("en-GB",{month:"long",year:"numeric"})}</strong></p><p><strong>Strengths:</strong> {latestReview.strengths}</p><p><strong>Areas to develop:</strong> {latestReview.development_areas}</p><p><strong>Next steps:</strong> {latestReview.next_steps}</p></div>:<p>No monthly review recorded.</p>}
 <p className="star-idp-report-footer">STAR Development Centre · Coaching development summary · For authorised parent/guardian sharing only. Coaching ratings are subjective and should be discussed in context.</p>
 </section>
 <div className="star-idp-report-actions"><button type="button" onClick={()=>window.print()}>Print / Save report as PDF</button><p>Opens your device’s print dialog. Choose “Save as PDF” to download. Review the report and confirm the intended parent/guardian before sharing; nothing is sent automatically.</p></div>
 </div>;
}
