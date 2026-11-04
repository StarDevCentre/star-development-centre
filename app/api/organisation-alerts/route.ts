import {NextRequest,NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {deliverOrganisationAlerts} from '../../../lib/organisationEmailWorker';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:NextRequest){
 const secret=process.env.STAR_ORGANISATION_WORKER_SECRET||'',provided=request.headers.get('x-star-worker-secret')||'';
 if(!/^[a-f0-9]{64}$/.test(secret)||!/^[a-f0-9]{64}$/.test(provided)||!timingSafeEqual(Buffer.from(provided),Buffer.from(secret)))return NextResponse.json({error:'Unauthorised'},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,apiKey=process.env.RESEND_API_KEY,from=process.env.STAR_ENQUIRY_FROM;
 if(process.env.VERCEL_ENV!=='production'||!url||!key||!apiKey||!from)return NextResponse.json({error:'Delivery unavailable'},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const rpc=async(action:string,data:Record<string,unknown>={})=>{const result=await db.rpc('star_organisation_email_worker',{p_secret:secret,p_action:action,p_data:data});if(result.error)throw new Error('Queue operation failed');return result.data};
 try{const result=await deliverOrganisationAlerts({rpc,apiKey,from});return NextResponse.json(result,{headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}})}catch{return NextResponse.json({error:'Delivery could not complete'},{status:503})}
}
