"use client";
import {usePlayerExperience} from './PlayerExperienceContext';
export function PracticeRating({ kind, value, onChange, disabled = false }: { kind: 'confidence' | 'enjoyment'; value: number | null; onChange: (value: number | null) => void; disabled?: boolean }) {
 const {isChild}=usePlayerExperience();
 const labels=kind==='confidence'?(isChild?['Not sure yet','A bit unsure','Okay','Ready','Really ready']:['Getting started','Finding my feet','Feeling okay','Confident','Really confident']):(isChild?['Not fun','A little','Okay','Fun','Lots of fun']:['Not much','A little','It was okay','Enjoyed it','Loved it']);
 const name=kind==='confidence'?'Confidence':'Enjoyment';
 return <fieldset className="ps-rating-picker" disabled={disabled}><legend>{kind==='confidence'?(isChild?'Did you feel ready to try?':'How confident did you feel?'):(isChild?'Was it fun?':'How much did you enjoy it?')} <small>Optional</small></legend><div className="ps-rating-options">{labels.map((label,i)=><button key={label} type="button" aria-pressed={value===i+1} aria-label={`${name} ${i+1} of 5: ${label}`} onClick={()=>onChange(value===i+1?null:i+1)}>{i+1}<span aria-hidden="true">{['◔','◑','◕','●','★'][i]}</span></button>)}</div><div className="ps-rating-ends"><span>1 · {labels[0]}</span><span>5 · {labels[4]}</span></div>{value!==null&&<p className="ps-rating-selected" role="status">{name}: {value}/5 · {labels[value-1]} <button type="button" onClick={()=>onChange(null)}>Clear {name.toLowerCase()}</button></p>}</fieldset>;
}
export function PracticeRatingSummary({ confidence, enjoyment }: { confidence: number | null; enjoyment: number | null }) {
 return confidence!==null||enjoyment!==null?<div className="ps-rating-summary">{confidence!==null&&<span>Confidence <strong>{confidence}/5</strong></span>}{enjoyment!==null&&<span>Enjoyment <strong>{enjoyment}/5</strong></span>}</div>:null;
}
