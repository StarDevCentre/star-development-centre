/** Calendar inputs and displays always use UK civil time, independent of device timezone. */
export const ukDateTime = (iso: string) => new Date(iso).toLocaleString('en-GB', {timeZone:'Europe/London',dateStyle:'medium',timeStyle:'short'});
export const ukDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', {timeZone:'Europe/London'});
export function ukDateTimeInput(iso: string) {
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(iso));
 const p=(type:string)=>parts.find(x=>x.type===type)?.value;
 return `${p('year')}-${p('month')}-${p('day')}T${p('hour')}:${p('minute')}`;
}
export function ukInputToISO(value: string) {
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw new Error('Enter a valid UK date and time.');
 const civil=Date.parse(value+'Z');
 // Try both UK offsets. Spring's missing hour is rejected; the repeated autumn hour is explicit.
 const candidates=[civil,civil-3600000].filter(t=>Number.isFinite(t)&&ukDateTimeInput(new Date(t).toISOString())===value);
 if(candidates.length!==1)throw new Error(candidates.length?'This UK time occurs twice when clocks change. Choose a time outside 01:00–01:59.':'This UK time does not exist when clocks change. Choose another time.');
 return new Date(candidates[0]).toISOString();
}
export function attendanceSummary(marks: {status:string}[], expected?:number) {
 const counts={present:0,late:0,absent:0,excused:0,unmarked:0};
 for(const mark of marks){const s=mark.status.toLowerCase();if(s==='attended'||s==='present')counts.present++;else if(s==='late')counts.late++;else if(s==='absent'||s==='no_show')counts.absent++;else if(s==='excused')counts.excused++;}
 counts.unmarked=Math.max(0,(expected??marks.length)-counts.present-counts.late-counts.absent-counts.excused);
 const attended=counts.present+counts.late,eligible=attended+counts.absent;
 return {...counts,attended,eligible,percentage:eligible?Math.round(100*attended/eligible):null};
}
