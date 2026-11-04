export const programmes=[
{slug:"sparks",title:"STAR Sparks",age:"AGES 5–10",summary:"A joyful introduction to football, movement, technique and confidence.",detail:"Monday · 3:45–4:45pm · Separate ages 5–7 and 8–10 groups, maximum 10 each",index:"01"},
{slug:"development",title:"Development Groups",age:"AGES 11–16",summary:"Small-group coaching to sharpen technique, decisions and game understanding.",detail:"Tuesday · Ages 11–13 at 4pm / Ages 14–16 at 5pm",index:"02"},
{slug:"flyers",title:"STAR Flyers",age:"AGES 7–10",summary:"Structured one-to-one development with individual goals and progress reviews.",detail:"16 weekly sessions · 60 minutes each",index:"03"},
{slug:"prestige",title:"STAR Prestige",age:"AGES 11–18",summary:"Sustained individual development shaped around the player’s confidence and ambitions.",detail:"24 weekly sessions · 90 minutes each",index:"04"},
{slug:"one-to-one",title:"One to One Coaching",age:"AGES 11–18",summary:"Personal coaching focused on the individual player and her football goals.",detail:"Sessions arranged individually",index:"05"},
{slug:"season-support",title:"Player Season Support",age:"CLUB PLAYERS",summary:"Club training support and match observations that connect coaching with her team football.",detail:"Club visits and match observations · Arranged individually",index:"06"}];
export const method=["Observe & assess","Understand","Plan","Coach","Challenge","Apply","Review & adapt"];

export function programmeForAge(slug:string,age:number){
 if(!Number.isInteger(age)||age<5||age>18)return false;
 if(slug==="sparks")return age<=10;
 if(slug==="development")return age>=11&&age<=16;
 if(slug==="flyers")return age>=7&&age<=10;
 if(slug==="prestige"||slug==="one-to-one")return age>=11;
 return slug==="season-support";
}

export function playerAge(dateOfBirth:string,today=new Date()){
 const birth=new Date(dateOfBirth+"T12:00:00Z");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)||!Number.isFinite(birth.getTime())||birth.toISOString().slice(0,10)!==dateOfBirth)return NaN;
 let age=today.getUTCFullYear()-birth.getUTCFullYear();
 if(today.getUTCMonth()<birth.getUTCMonth()||(today.getUTCMonth()===birth.getUTCMonth()&&today.getUTCDate()<birth.getUTCDate()))age--;
 return age;
}


