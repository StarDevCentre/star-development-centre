import {ParentExperienceDevelopmentCheck} from '../../../../components/ParentExperienceDevelopmentCheck';
import '../../parent.css';
export const metadata={title:'Parent Space · Development UI check',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{viewport?:string}>}){
 const {viewport}=await searchParams;
 if(viewport&&['320','390','430'].includes(viewport))return <div className="ppx-responsive-review"><header><strong>Parent Space · phone layout check</strong><nav aria-label="Review width">{['320','390','430'].map(w=><a key={w} href={`?viewport=${w}`} aria-current={viewport===w?'page':undefined}>{w}px</a>)}<a href="/parent-portal/preview/connected">Full width</a></nav></header><iframe title="Parent Space phone preview" src="/parent-portal/preview/connected" style={{width:Number(viewport)}}/></div>;
 return <ParentExperienceDevelopmentCheck/>;
}
