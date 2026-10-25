"use client";
type Assessment={id:string;assessed_on:string;category:string;rating:number;development_area:string;action_plan:string};
type Goal={id:string;goal:string;status:string};
type Observation={id:string;category:string;observation:string;next_action:string|null;recorded_at:string};
const categories=["Technical","Tactical","Physical","Psychological","Social"];
const format=(date:string)=>new Date(date+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
export function DevelopmentIntelligence({assessments,goals,observations}:{assessments:Assessment[];goals:Goal[];observations:Observation[]}){
 const now=Date.now(),days=(date:string)=>Math.floor((now-new Date(date+"T12:00:00").getTime())/86400000);
 const metrics=categories.map(category=>{const entries=assessments.filter(a=>a.category===category).sort((a,b)=>a.assessed_on.localeCompare(b.assessed_on)||a.id.localeCompare(b.id));const latest=entries.at(-1),previous=entries.length>1?entries.at(-2):undefined;const delta=latest&&previous?latest.rating-previous.rating:null;return {category,latest,previous,delta,age:latest?days(latest.assessed_on):null}});
 const pending=goals.filter(g=>g.status!=="achieved"),achieved=goals.filter(g=>g.status==="achieved");
 const stale=metrics.filter(m=>m.age===null||m.age>60),lower=metrics.filter(m=>m.delta!==null&&m.delta<0);
 const actions=observations.filter(o=>o.next_action?.trim()).sort((a,b)=>b.recorded_at.localeCompare(a.recorded_at)).slice(0,4);
 return <section className="star-intelligence" aria-label="Coach development insights"><h4>Development intelligence</h4><p>Evidence-led prompts to help plan the next coaching session. These are coaching decision aids, not automated judgements about a player.</p>
 <div className="star-hub-metrics"><div><strong>{pending.length}</strong><span>Goals in progress</span></div><div><strong>{achieved.length}</strong><span>Goals achieved</span></div><div><strong>{metrics.filter(m=>m.delta!==null).length}/5</strong><span>Areas with repeat ratings</span></div><div><strong>{stale.length}</strong><span>Areas needing assessment</span></div></div>
 <div className="star-hub-columns"><div className="star-hub-panel"><h5>Assessment trends</h5>{metrics.map(m=><div key={m.category} className="star-intelligence-line"><strong>{m.category}</strong><span>{m.latest?m.latest.rating+"/5":"Not assessed"}</span><span>{m.delta===null?"Awaiting comparison":m.delta>0?"+"+m.delta+" since previous":m.delta<0?m.delta+" since previous":"Unchanged"}</span><small>{m.latest?format(m.latest.assessed_on):"Add first assessment"}</small></div>)}<p className="star-hub-hint">Compares the two most recent assessments per area. Changes in coach ratings are not proof of improvement or regression.</p></div>
 <div className="star-hub-panel"><h5>Coaching attention</h5>{stale.length?<p><strong>Assessment coverage:</strong> {stale.map(m=>m.category).join(", ")} {stale.length===1?"has":"have"} no assessment in the last 60 days. Consider reassessing when appropriate.</p>:<p>All five areas have an assessment within the last 60 days.</p>}
 {lower.length?<p><strong>Discuss at review:</strong> {lower.map(m=>m.category).join(", ")} {lower.length===1?"has a lower recent coach rating":"have lower recent coach ratings"}. Check context and evidence before changing the plan.</p>:<p>No lower ratings in areas with repeat assessments.</p>}
 <h5>Current goal priorities</h5>{pending.length?pending.slice(0,5).map(g=><p key={g.id}>• {g.goal}</p>):<p>No active goals recorded. Consider setting a specific coaching target.</p>}</div></div>
 <div className="star-hub-panel"><h5>Recent evidence and next actions</h5>{actions.length?actions.map(o=><div key={o.id} className="star-hub-note"><small>{o.category} · {new Date(o.recorded_at).toLocaleDateString("en-GB")}</small><p><strong>Next action:</strong> {o.next_action}</p></div>):<p>No coaching next actions recorded. Add a coaching observation to connect assessment ratings with practice.</p>}</div>
 <p className="star-hub-hint">Goal completion reflects recorded statuses; this view does not infer progress towards goals from unrelated ratings. Assessment reminders use a 60-day review prompt, not a mandatory standard.</p>
 </section>
}
