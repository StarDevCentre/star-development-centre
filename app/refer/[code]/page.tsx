import {OrganisationReferralPage} from '../../../components/OrganisationReferralPage';
import '../../../components/organisation-portal.css';
export const metadata={title:'Your School & Club Referral',description:'Take the next step in girls’ football with your school or club and STAR.',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{code:string}>}){const{code}=await params;return <OrganisationReferralPage code={code}/>}
