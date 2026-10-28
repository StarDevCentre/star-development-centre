import {StaffCoachingDevelopmentCheck} from '../../../../components/StaffCoachingDevelopmentCheck';
import './review.css';
export const metadata={title:'Staff coaching · Development check',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{viewport?:string}>}){
 const {viewport}=await searchParams;
 if(viewport&&['320','390','430'].includes(viewport))return <div className="staff-review-phone"><nav aria-label="Review widths">{['320','390','430'].map(w=><a key={w} href={`?viewport=${w}`}>{w}px</a>)}<a href="/staff/preview/coaching">Full width</a></nav><iframe title="Staff coaching phone preview" src="/staff/preview/coaching" style={{width:Number(viewport)}}/></div>;
 return <StaffCoachingDevelopmentCheck/>;
}
