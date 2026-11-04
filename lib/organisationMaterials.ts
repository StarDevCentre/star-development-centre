import {referralLink,type OrganisationBrandData} from './organisationPortal';
const escape=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
function lines(text:string,max:number){const result:string[]=[];for(const word of text.trim().split(/\s+/)){const last=result.at(-1);if(last&&last.length+word.length+1<=max)result[result.length-1]=last+' '+word;else result.push(word)}return result}
export function organisationCopy(org:OrganisationBrandData){const url=referralLink(org.referral_code);return {
 'Parent email':{subject:'Book her free football assessment with '+org.name+' and STAR',body:`Dear parents and carers,\n\n${org.name} is working with STAR Development Centre as our Football Development Partner. STAR offers personalised football coaching for girls aged 5–18 in Somerset, supporting confidence, enjoyment and individual development.\n\nBook a free, 30-minute football assessment for your daughter. Send your request through our referral page:\n${url}\n\nCreate or sign into your parent account, complete the short referral and confirm permission to share it with STAR and ${org.name}. STAR aims to make first contact within 12 hours and will agree the assessment time and venue with you. The assessment is free; any ongoing coaching costs are confirmed separately.\n\nA referral does not enrol your daughter in a programme or share her existing player records.\n\nBest wishes,\n${org.name}`},
 'Newsletter':{body:`Girls’ football development with STAR\n\n${org.name} is working with STAR Development Centre, our Football Development Partner, to help girls aged 5–18 in Somerset build confidence and develop their game. Book a free, 30-minute assessment: parents and carers can send a request through ${url}. Sign in or create a parent account to share her interests and goals. STAR will contact you to agree the assessment arrangements. Any ongoing coaching costs are confirmed separately.`},
 'Social caption':{body:`Her next step in football ⚽\n\n${org.name} is working with STAR Development Centre as our Football Development Partner. Personalised girls’ football coaching for ages 5–18 in Somerset, built around confidence, enjoyment and her game.\n\nParents and carers: book a free, 30-minute assessment. Send your request at ${url}\n\nSTAR will confirm the assessment time and venue. Any ongoing coaching costs are confirmed separately.\n\n#GirlsFootball #SomersetFootball #STARDevelopmentCentre`}
 }}
/** Independent artwork formats; the caller embeds the appropriate photo or illustration. */
export async function organisationMaterialSvg(org:OrganisationBrandData,format:'poster'|'social',starLogo:string,orgLogo:string,artwork:string){
 if(format==='poster'){const {organisationPosterSvg}=await import('./organisationPoster');return organisationPosterSvg(org,starLogo,orgLogo,artwork)}
 return organisationSocialSvg(org,format,starLogo,orgLogo,artwork);
}
async function organisationSocialSvg(org:OrganisationBrandData,format:'poster'|'social',starLogo:string,orgLogo:string,photo:string){
 const tall=format==='poster',height=tall?1527:1080,heroTop=200,heroBottom=tall?1060:700;
 const {default:font}=await import('./organisationArtworkFont.json');
 const glyphs=font.glyphs as Record<string,{d:string;w:number}>;
 function heading(value:string,x:number,y:number,size:number,fill:string,maxWidth=960){
  const width=Array.from(value).reduce((sum,c)=>sum+(glyphs[c]?.w||0),0),scale=Math.min(size/font.units,maxWidth/Math.max(1,width));let cursor=0;
  return `<g aria-label="${escape(value)}" fill="${fill}" transform="translate(${x} ${y}) scale(${scale} ${-scale})">${Array.from(value).map(c=>{const g=glyphs[c];if(!g)return '';const path=`<path transform="translate(${cursor} 0)" d="${g.d}"/>`;cursor+=g.w;return path}).join('')}</g>`;
 }
 const text=(value:string,x:number,y:number,size:number,fill='#071c3b',weight=400)=>`<text x="${x}" y="${y}" fill="${fill}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${weight}">${escape(value)}</text>`;
 const {default:QRCode}=await import('qrcode');
 const qrSize=tall?260:224,qrX=1080-qrSize-48,qrY=heroBottom+28;
 const qr=await QRCode.toString(referralLink(org.referral_code),{type:'svg',errorCorrectionLevel:'M',margin:4,width:qrSize,color:{dark:'#071c3b',light:'#ffffff'}});
 const colour=/^#[0-9a-f]{6}$/i.test(org.brand_colour||'')?org.brand_colour!:'#071c3b';
 // Bound long names and unbroken words within the organisation's own header.
 const nameX=orgLogo?240:56,nameWidth=1024-nameX;
 const nameParts=lines(org.name.replace(/(\S{24})(?=\S)/g,'$1 '),orgLogo?34:45);
 const nameSize=Math.min(44,100/Math.max(1,nameParts.length),nameWidth/(Math.max(...nameParts.map(l=>l.length),1)*0.65));
 const firstNameY=95-(nameParts.length-1)*nameSize*0.55;
 const name=nameParts.map((line,i)=>text(line,nameX,firstNameY+i*nameSize*1.1,nameSize,'#071c3b',800)).join('');
 const headlineY=tall?370:340,step=tall?124:85,headlineSize=tall?126:90;
 const ctaY=heroBottom+85,partnerY=tall?1370:970;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}" role="img" aria-label="${escape(org.name)}: book a free STAR football assessment">
 <title>${escape(org.name)} — Book a free assessment</title>
 <defs><linearGradient id="shade"><stop stop-color="#071c3b"/><stop offset=".45" stop-color="#071c3b"/><stop offset=".64" stop-color="#071c3b" stop-opacity=".25"/><stop offset="1" stop-color="#071c3b" stop-opacity="0"/></linearGradient><linearGradient id="gold" x2="0.8" y2="1"><stop stop-color="#ffdb83"/><stop offset=".5" stop-color="#e6be62"/><stop offset="1" stop-color="#bb8429"/></linearGradient><clipPath id="hero"><rect y="${heroTop}" width="1080" height="${heroBottom-heroTop}"/></clipPath></defs>
 <rect width="1080" height="${height}" fill="#ffffff"/>
 <rect width="1080" height="12" fill="${colour}"/>
 ${orgLogo?`<image href="${escape(orgLogo)}" x="52" y="32" width="150" height="130" preserveAspectRatio="xMidYMid meet"/>`:''}${name}
 ${text('GIRLS’ FOOTBALL · YOUR NEXT STEP',nameX,167,20,'#53647a',700)}
 <rect y="${heroTop}" width="1080" height="${heroBottom-heroTop}" fill="#071c3b"/>
 <g clip-path="url(#hero)"><image href="${escape(photo)}" x="465" y="${heroTop}" width="615" height="${heroBottom-heroTop}" preserveAspectRatio="xMidYMid slice"/><rect y="${heroTop}" width="1080" height="${heroBottom-heroTop}" fill="url(#shade)"/></g>
 <rect x="56" y="${heroTop+35}" width="54" height="5" fill="#e6be62"/>
 ${text('HER GAME. HER NEXT STEP.',125,heroTop+45,18,'#ffffff',700)}
 ${heading('BUILD HER',56,headlineY,headlineSize,'#ffffff',490)}
 ${heading('CONFIDENCE.',56,headlineY+step,headlineSize,'#ffffff',510)}
 ${heading('DEVELOP',56,headlineY+step*2,headlineSize,'url(#gold)',480)}
 ${heading('HER GAME.',56,headlineY+step*3,headlineSize,'url(#gold)',480)}
 ${text('Personalised football coaching',60,heroBottom-66,25,'#ffffff')}
 ${text('Girls aged 5–18 · Somerset',60,heroBottom-29,25,'#ffffff')}
 <path d="M0 ${heroBottom}H1080" stroke="#e6be62" stroke-width="8"/>
 ${heading('BOOK A FREE',56,ctaY,tall?63:53,'#071c3b',680)}
 ${heading('ASSESSMENT',56,ctaY+(tall?68:58),tall?72:62,'#071c3b',680)}
 ${text('30 minutes. A first step built around her.',60,ctaY+(tall?113:93),tall?27:23)}
 ${tall?text('Scan to send your request through your parent account.',60,ctaY+161,23):''}
 ${tall?text('STAR will confirm a suitable time and venue with you.',60,ctaY+196,23):text('Scan to request. STAR will confirm the arrangements.',60,ctaY+128,21)}
 ${qr.replace('<svg ',`<svg x="${qrX}" y="${qrY}" `)}
 ${text('SCAN TO GET STARTED',qrX+qrSize/2,tall?qrY+qrSize+22:qrY+qrSize+16,tall?18:15).replace('<text ','<text text-anchor="middle" ')}
 <path d="M56 ${partnerY-24}H750" stroke="#dce2eb" stroke-width="2"/>
 <image href="${escape(starLogo)}" x="56" y="${partnerY-5}" width="160" height="92" preserveAspectRatio="xMidYMid meet"/>
 ${text('FOOTBALL DEVELOPMENT PARTNER',244,partnerY+22,tall?22:19,'#53647a',700)}
 ${text('Believe. Develop. Achieve.',244,partnerY+58,25,'#071c3b',700)}
 ${text('starfootball.uk · 07902 594064',244,partnerY+91,21)}
 <path d="M970 ${height}H1080V${height-110}Z" fill="${colour}"/><path d="M1010 ${height}L1080 ${height-70}" stroke="#e6be62" stroke-width="12"/>
 </svg>`;
}
