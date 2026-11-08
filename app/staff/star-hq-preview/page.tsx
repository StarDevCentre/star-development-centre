import {StarHQOwnerGate} from "../../../components/star-hq/StarHQOwnerGate";
import "../../../components/star-hq/star-hq.css";
export const metadata={title:"STAR HQ | Owner Prototype",robots:{index:false,follow:false,noarchive:true}};
export const dynamic="force-dynamic";
/** Not linked from Player Space. Server API checks current active owner before mounting WebGL. */
export default function StarHQPreviewPage(){return <StarHQOwnerGate/>;}
