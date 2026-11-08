import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store, max-age=0","X-Robots-Tag":"noindex, nofollow","Content-Type":"application/json"};
function response(body:{allowed:boolean},status:number){return new Response(JSON.stringify(body),{status,headers});}
/** Fail closed. Does not return account information or read any player data. */
export async function POST(request:Request){
 const authorization=request.headers.get("authorization")||"";
 const origin=request.headers.get("origin");
 // Protect against cross-site browser requests even if an access token were exposed.
 if(origin&&new URL(origin).origin!==new URL(request.url).origin)return response({allowed:false},403);
 if(!/^Bearer [A-Za-z0-9._~-]+$/.test(authorization))return response({allowed:false},401);
 const token=authorization.slice(7);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return response({allowed:false},503);
 try{
  // When Supabase is configured with accessToken, supabase.auth is intentionally
  // unavailable. Verify the user's own Supabase session using a plain auth client
  // first, then make the owner-membership query with that verified JWT.
  const authClient=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
  const {data:userInfo,error:authError}=await authClient.auth.getUser(token);
  if(authError||!userInfo.user||userInfo.user.is_anonymous)return response({allowed:false},401);
  const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false},accessToken:async()=>token});
  const {data:owner,error:ownerError}=await db.from("staff_members").select("user_id")
   .eq("user_id",userInfo.user.id).eq("role","owner").eq("active",true).maybeSingle();
  if(ownerError||!owner)return response({allowed:false},403);
  return response({allowed:true},200);
 }catch{return response({allowed:false},403);}
}
export async function GET(){return response({allowed:false},405);}
