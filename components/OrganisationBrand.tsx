import {organisationTheme} from '../lib/organisationTheme';
import {organisationLogo,type OrganisationBrandData} from '../lib/organisationPortal';
export function OrganisationBrand({org,compact=false}:{org:OrganisationBrandData;compact?:boolean}){
 return <section className={'org-brand'+(compact?' org-brand-compact':'')} style={organisationTheme(org.brand_colour)}>
  <div className="org-brand-identity">{organisationLogo(org.logo_path)&&<img src={organisationLogo(org.logo_path)} alt={org.name+' logo'} width="120" height="120"/>}<div><p className="org-eyebrow">{org.kind==='school'?'YOUR SCHOOL':'YOUR CLUB'} · SOMERSET FOOTBALL</p><h2>{org.name}</h2>{!compact&&<p>{org.welcome_text||'Welcome to our connection with STAR. Together, we help girls find their next step in football.'}</p>}</div></div>
  <div className="org-brand-partner"><img src="/images/star-colour-transparent.webp" alt="STAR Development Centre" width="160" height="80"/><span>Football Development Partner</span></div>
 </section>;
}
