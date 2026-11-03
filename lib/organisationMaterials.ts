import {referralLink,type OrganisationBrandData} from './organisationPortal';
const escape=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
function lines(text:string,max:number){const result:string[]=[];for(const word of text.trim().split(/\s+/)){const last=result.at(-1);if(last&&last.length+word.length+1<=max)result[result.length-1]=last+' '+word;else result.push(word)}return result}
function textLines(text:string,x:number,y:number,max:number,size:number,fill:string,weight=400){return lines(text,max).map((line,i)=>`<text x="${x}" y="${y+i*size*1.25}" fill="${fill}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${weight}">${escape(line)}</text>`).join('')}
export function organisationCopy(org:OrganisationBrandData){const url=referralLink(org.referral_code);return {
 'Parent email':{subject:'A next step in football with '+org.name+' and STAR',body:`Dear parents and carers,\n\n${org.name} is working with STAR Development Centre as our Football Development Partner. STAR offers personalised football coaching for girls aged 5–18 in Somerset, supporting confidence, enjoyment and individual development.\n\nIf your daughter would like support with her football, you can start a conversation through our referral page:\n${url}\n\nCreate or sign into your parent account, complete the short referral and confirm permission to share it with STAR and ${org.name}. STAR aims to make first contact within 12 hours. Session arrangements and any coaching costs are confirmed separately.\n\nA referral does not enrol your daughter in a programme or share her existing player records.\n\nBest wishes,\n${org.name}`},
 'Newsletter':{body:`Girls’ football development with STAR\n\n${org.name} is working with STAR Development Centre, our Football Development Partner, to help girls aged 5–18 in Somerset build confidence and develop their game. Parents and carers can refer their daughter through ${url}. Sign in or create a parent account to share her interests and goals. STAR will contact you to discuss a suitable next step; coaching arrangements and costs are confirmed separately.`},
 'Social caption':{body:`Her next step in football ⚽\n\n${org.name} is working with STAR Development Centre as our Football Development Partner. Personalised girls’ football coaching for ages 5–18 in Somerset, built around confidence, enjoyment and her game.\n\nParents and carers: start a conversation at ${url}\n\nSession arrangements and coaching costs confirmed separately.\n\n#GirlsFootball #SomersetFootball #STARDevelopmentCentre`}
 }}
export async function organisationMaterialSvg(org:OrganisationBrandData,format:'poster'|'social',starLogo:string,orgLogo:string){
 const tall=format==='poster',height=tall?1350:1080,qrSize=tall?300:245,qrY=tall?810:665;
 const{default:QRCode}=await import('qrcode');
 const qr=await QRCode.toString(referralLink(org.referral_code),{type:'svg',errorCorrectionLevel:'M',margin:4,width:qrSize,color:{dark:'#071c3b',light:'#ffffff'}});
 const qrSvg=qr.replace('<svg ',`<svg x="70" y="${qrY}" `);
 const colour=/^#[0-9a-f]{6}$/i.test(org.brand_colour||'')?org.brand_colour!:'#071c3b';
 const nameSize=org.name.length>85?27:org.name.length>45?32:38;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}" role="img" aria-label="${escape(org.name)} and STAR football referral"><rect width="1080" height="${height}" fill="#071c3b"/><path d="M650 260L1080 260L1080 690Z" fill="#12345b"/><path d="M900 ${height}H1080V${height-180}Z" fill="#e6be62"/><rect width="1080" height="260" fill="white"/><rect y="260" width="1080" height="12" fill="${colour}"/>
 ${orgLogo?`<image href="${escape(orgLogo)}" x="60" y="35" width="175" height="170" preserveAspectRatio="xMidYMid meet"/>`:''}
 ${textLines(org.name,orgLogo?270:60,75,orgLogo?35:47,nameSize,'#071c3b',700)}
 <text x="60" y="242" font-family="Arial,sans-serif" font-size="17" letter-spacing="2" fill="#53647a">WITH STAR · FOOTBALL DEVELOPMENT PARTNER</text>
 <text x="65" y="350" fill="#e6be62" font-family="Arial,sans-serif" font-size="20" letter-spacing="3">HER NEXT STEP IN FOOTBALL</text>
 ${textLines('BUILD HER CONFIDENCE.',65,445,30,67,'#ffffff',900)}
 ${textLines('DEVELOP HER GAME.',65,530,30,67,'#e6be62',900)}
 ${textLines('Personalised girls’ football coaching for ages 5–18 in Somerset.',70,610,57,29,'#ffffff')}
 ${qrSvg}
 ${textLines('PARENTS & CARERS',tall?425:365,qrY+55,27,23,'#e6be62',700)}
 ${textLines('Scan to start a conversation',tall?425:365,qrY+105,tall?24:30,32,'#ffffff',700)}
 ${textLines('Sign in or create your parent account to refer your daughter.',tall?425:365,qrY+205,tall?32:38,23,'#ffffff')}
 <rect x="65" y="${height-160}" width="${tall?320:270}" height="110" rx="8" fill="white"/><image href="${escape(starLogo)}" x="80" y="${height-152}" width="${tall?290:240}" height="94" preserveAspectRatio="xMidYMid meet"/>
 <text x="${tall?425:365}" y="${height-115}" fill="white" font-family="Arial,sans-serif" font-size="23" font-weight="700">Believe. Develop. Achieve.</text>
 <text x="${tall?425:365}" y="${height-78}" fill="white" font-family="Arial,sans-serif" font-size="20">starfootball.uk · 07902 594064</text>
 <text x="65" y="${height-20}" fill="white" font-family="Arial,sans-serif" font-size="17">Session arrangements and coaching costs confirmed separately.</text></svg>`;
}
