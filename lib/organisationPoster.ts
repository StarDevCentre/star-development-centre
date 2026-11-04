import {referralLink,type OrganisationBrandData} from './organisationPortal';
const escape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));

/** A4 noticeboard artwork inspired by Player Space's paper, tape and sticker graphics. */
export async function organisationPosterSvg(org:OrganisationBrandData,starLogo:string,orgLogo:string,player:string){
 const [{default:font},{default:QRCode}]=await Promise.all([import('./organisationArtworkFont.json'),import('qrcode')]);
 const glyphs=font.glyphs as Record<string,{d:string;w:number}>;
 function heading(value:string,x:number,y:number,size:number,fill:string,maxWidth=920){
  const width=Array.from(value).reduce((sum,c)=>sum+(glyphs[c]?.w||0),0),scale=Math.min(size/font.units,maxWidth/Math.max(1,width));let cursor=0;
  return `<g aria-label="${escape(value)}" fill="${fill}" transform="translate(${x} ${y}) scale(${scale} ${-scale})">${Array.from(value).map(c=>{const g=glyphs[c];if(!g)return '';const path=`<path transform="translate(${cursor} 0)" d="${g.d}"/>`;cursor+=g.w;return path}).join('')}</g>`;
 }
 const text=(value:string,x:number,y:number,size:number,fill='#06142e',weight=400)=>`<text x="${x}" y="${y}" fill="${fill}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${weight}">${escape(value)}</text>`;
 const colour=/^#[0-9a-f]{6}$/i.test(org.brand_colour||'')?org.brand_colour!:'#06142e';
 const nameX=orgLogo?225:65,nameWidth=985-nameX,nameParts:string[]=[];
 for(const word of org.name.replace(/(\S{23})(?=\S)/g,'$1 ').trim().split(/\s+/)){
  const last=nameParts.at(-1);if(last&&last.length+word.length+1<=(orgLogo?32:42))nameParts[nameParts.length-1]=last+' '+word;else nameParts.push(word);
 }
 const nameSize=Math.min(42,70/(Math.max(1,nameParts.length)*1.1),nameWidth/(Math.max(...nameParts.map(l=>l.length),1)*.65));
 const name=nameParts.map((line,i)=>text(line,nameX,112-(nameParts.length-1)*nameSize*.55+i*nameSize*1.1,nameSize,'#06142e',800)).join('');
 const qr=await QRCode.toString(referralLink(org.referral_code),{type:'svg',errorCorrectionLevel:'M',margin:4,width:230,color:{dark:'#06142e',light:'#ffffff'}});
 const star=(x:number,y:number,size:number,fill='#f5c64d',rotation=0)=>`<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${size/24})"><path d="m12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" fill="${fill}" stroke="#06142e" stroke-width="1.3" stroke-linejoin="round"/></g>`;
 const icon=(kind:'ball'|'star'|'smile',x:number,y:number)=>`<g transform="translate(${x} ${y}) scale(2.3)" fill="none" stroke="#06142e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${kind==='ball'?'<circle cx="12" cy="12" r="10"/><path d="m12 7 5 4-2 6H9l-2-6zM12 2v5m10 4h-5M2 11h5m0 9 2-3m8 3-2-3"/>':kind==='star'?'<path d="m12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z"/>':'<circle cx="12" cy="12" r="10"/><path d="M8 9h.01M16 9h.01M7 14q5 7 10 0"/>'}</g>`;
 const chip=(x:number,label:string,kind:'ball'|'star'|'smile')=>`<rect x="${x+4}" y="974" width="296" height="112" rx="10" fill="#06142e"/><rect x="${x}" y="968" width="296" height="112" rx="10" fill="#ffffff" stroke="#06142e" stroke-width="3"/>${icon(kind,x+120,979)}${heading(label,x+18,1060,30,'#06142e',260)}`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 1050 1485" role="img" aria-label="${escape(org.name)}: Your game. Your way. Girls’ football with STAR. Book a free assessment.">
 <title>${escape(org.name)} — Your game. Your way.</title>
 <defs><pattern id="dots" width="17" height="17" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#06142e" opacity=".12"/></pattern><clipPath id="safe"><rect x="50" y="50" width="950" height="1385"/></clipPath></defs>
 <rect width="1050" height="1485" fill="#ffffff"/>
 <g clip-path="url(#safe)">
 <rect x="50" y="50" width="950" height="7" fill="${colour}"/>
 ${orgLogo?`<image href="${escape(orgLogo)}" x="65" y="70" width="125" height="108" preserveAspectRatio="xMidYMid meet"/>`:''}${name}
 ${text('GIRLS’ FOOTBALL · SOMERSET',nameX,170,20,'#53647a',700)}
 <path d="M50 205 1000 195 1000 945 50 950Z" fill="#fff5d7"/>
 <circle cx="800" cy="608" r="337" fill="#f5c64d" opacity=".5"/>
 <rect x="50" y="205" width="950" height="745" fill="url(#dots)"/>
 <path d="m630 273 325-28-84 84-278 29zM765 790l215-70-94 160-212 31Z" fill="#df1f38"/>
 <path d="M190 884Q365 826 486 884T869 866" fill="none" stroke="#06142e" stroke-width="5" stroke-dasharray="12 15"/>
 <g transform="rotate(-3 240 250)"><path d="m67 214 440 4-8 45-426-2z" fill="#df1f38"/>${text('GIRLS AGED 5–18 · ALL LEVELS',83,248,20,'#ffffff',800)}</g>
 ${heading('YOUR GAME.',65,365,132,'#06142e',580)}
 <g transform="rotate(-3 320 430)"><path d="m57 391 538-9 10 113-548 10z" fill="#f5c64d"/>${heading('YOUR WAY.',73,480,132,'#06142e',520)}</g>
 ${text('Try something new.',70,566,34,'#06142e',800)}
 ${text('Build your skills.',70,617,34,'#06142e',800)}
 ${text('Find your confidence.',70,668,34,'#06142e',800)}
 ${text('New to football?',70,743,26,'#06142e',700)}
 ${text('Already love playing?',70,781,26,'#06142e',700)}
 ${text('Start from where you are.',70,823,25)}
 <image href="${escape(player)}" x="470" y="263" width="530" height="730" preserveAspectRatio="xMidYMax meet"/>
 ${star(76,852,66,'#ffffff',-13)}${star(359,870,40,'#f5c64d',12)}
 <g transform="rotate(-5 749 897)"><path d="m594 867 347 4-8 62-340-3z" fill="#06142e"/>${heading('BE BRAVE. BE YOU.',611,917,42,'#ffffff',310)}</g>
 ${chip(65,'TRY NEW SKILLS','ball')}${chip(377,'GROW CONFIDENCE','star')}${chip(689,'ENJOY FOOTBALL','smile')}
 ${text('Ask your parent or carer to scan.',65,1132,27,'#06142e',800)}
 ${heading('BOOK A FREE',65,1190,59,'#06142e',650)}
 ${heading('ASSESSMENT',65,1250,69,'#06142e',650)}
 ${text('30 minutes · Girls aged 5–18 · Somerset',65,1291,24)}
 ${text('Send a request through your parent account.',65,1329,21)}
 ${text('STAR will confirm the time and venue.',65,1359,21)}
 ${qr.replace('<svg ', '<svg x="755" y="1139" ')}
 <path d="M65 1380H985" stroke="#b6bfca" stroke-width="2"/>
 <image href="${escape(starLogo)}" x="65" y="1388" width="120" height="47" preserveAspectRatio="xMidYMid meet"/>
 ${text('FOOTBALL DEVELOPMENT PARTNER',215,1405,18,'#53647a',700)}
 ${text('Believe. Develop. Achieve.',215,1430,23,'#06142e',800)}
 ${text('starfootball.uk · 07902 594064',655,1430,19)}
 </g></svg>`;
}
