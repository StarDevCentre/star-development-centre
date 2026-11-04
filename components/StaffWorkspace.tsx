"use client";
import dynamic from "next/dynamic";
import {StaffPlayerContext} from "./StaffPlayerContext";
import {useState} from "react";
import {StaffAppShell} from "./StaffAppShell";
import {useStaffNavigation} from "./useStaffNavigation";
import {staffCanManage,staffSections,type StaffRole,type StaffSection} from "../lib/staffApp";
const StaffOnboarding=dynamic(()=>import("./StaffOnboarding").then(m=>m.StaffOnboarding),{loading:()=> <p role="status">Loading…</p>});
const StaffOrganisations=dynamic(()=>import("./StaffOrganisations").then(m=>m.StaffOrganisations),{loading:()=> <p role="status">Loading…</p>});
const StaffHome=dynamic(()=>import("./StaffHome").then(m=>m.StaffHome),{loading:()=> <p role="status">Loading…</p>});
const StaffMediaGallery=dynamic(()=>import("./StaffMediaGallery").then(m=>m.StaffMediaGallery),{loading:()=> <p role="status">Loading…</p>});
const StaffCoachingProfile=dynamic(()=>import("./StaffCoachingProfile").then(m=>m.StaffCoachingProfile),{loading:()=> <p role="status">Loading…</p>});
const StaffPlayers=dynamic(()=>import("./StaffPlayers").then(m=>m.StaffPlayers),{loading:()=> <p role="status">Loading…</p>});
import {OrganisationInboxSummary} from "./OrganisationInboxSummary";
import {FamilyUnreadBadge} from "./FamilyUnreadBadge";
const BadgeAwards=dynamic(()=>import("./BadgeAwards").then(m=>m.BadgeAwards),{loading:()=> <p role="status">Loading…</p>});
const StaffPlayerSpaceHub=dynamic(()=>import("./StaffPlayerSpaceHub").then(m=>m.StaffPlayerSpaceHub),{loading:()=> <p role="status">Loading…</p>});
const PlayerTrainingHub=dynamic(()=>import("./PlayerTrainingHub").then(m=>m.PlayerTrainingHub),{loading:()=> <p role="status">Loading…</p>});
const SessionChangeRequests=dynamic(()=>import("./SessionChangeRequests").then(m=>m.SessionChangeRequests),{loading:()=> <p role="status">Loading…</p>});
const StaffInbox=dynamic(()=>import("./StaffInbox").then(m=>m.StaffInbox),{loading:()=> <p role="status">Loading…</p>});
const AdmissionsManagement=dynamic(()=>import("./AdmissionsManagement").then(m=>m.AdmissionsManagement),{loading:()=> <p role="status">Loading…</p>});
const FamilyPublishing=dynamic(()=>import("./FamilyPublishing").then(m=>m.FamilyPublishing),{loading:()=> <p role="status">Loading…</p>});
const FamilyAccessAdmin=dynamic(()=>import("./FamilyAccessAdmin").then(m=>m.FamilyAccessAdmin),{loading:()=> <p role="status">Loading…</p>});
const StaffAdmin=dynamic(()=>import("./StaffAdmin").then(m=>m.StaffAdmin),{loading:()=> <p role="status">Loading…</p>});
const StaffSessionBuilder=dynamic(()=>import("./StaffSessionBuilder").then(m=>m.StaffSessionBuilder),{loading:()=> <p role="status">Loading…</p>});
const TrainingPlanner=dynamic(()=>import("./TrainingPlanner").then(m=>m.TrainingPlanner),{loading:()=> <p role="status">Loading…</p>});
const SessionAttendance=dynamic(()=>import("./SessionAttendance").then(m=>m.SessionAttendance),{loading:()=> <p role="status">Loading…</p>});
const CoachingRecords=dynamic(()=>import("./CoachingRecords").then(m=>m.CoachingRecords),{loading:()=> <p role="status">Loading…</p>});
const PlayerIDP=dynamic(()=>import("./PlayerIDP").then(m=>m.PlayerIDP),{loading:()=> <p role="status">Loading…</p>});
const PlayerPathways=dynamic(()=>import("./PlayerPathways").then(m=>m.PlayerPathways),{loading:()=> <p role="status">Loading…</p>});
const SessionAnalytics=dynamic(()=>import("./SessionAnalytics").then(m=>m.SessionAnalytics),{loading:()=> <p role="status">Loading…</p>});
export function StaffWorkspace({userId,role,onSignOut}:{userId:string;role:StaffRole;onSignOut:()=>void}){
 const{section,visited,goTo}=useStaffNavigation(role);const[menuOpen,setMenuOpen]=useState(false),[hubPlayerId,setHubPlayerId]=useState(""),[badgePlayerId,setBadgePlayerId]=useState(""),[rosterPlayerId,setRosterPlayerId]=useState(""),[sessionId,setSessionId]=useState(""),[rosterRequest,setRosterRequest]=useState(0),[hubRequest,setHubRequest]=useState(0),[badgeRequest,setBadgeRequest]=useState(0),[coachingTarget,setCoachingTarget]=useState<{playerId:string;sessionId:string;revision:number}|null>(null);
 const [profilePlayerId,setProfilePlayerId]=useState(""),[profileRequest,setProfileRequest]=useState(0),[publishingPlayerId,setPublishingPlayerId]=useState(""),[publishingRequest,setPublishingRequest]=useState(0);
 const [contextPlayer,setContextPlayer]=useState("");
 const[organisationTarget,setOrganisationTarget]=useState<{id:string;tab:string;revision:number}>({id:'',tab:'Access & players',revision:0});
 const[inboxTarget,setInboxTarget]=useState<{tab:string;revision:number}>({tab:"families",revision:0});
 const [planRequest,setPlanRequest]=useState<{id:string;revision:number}|null>(null);
 const [actionTarget,setActionTarget]=useState<{area:StaffSection;id:string;revision:number}|null>(null);
 const canManage=staffCanManage(role),allowed=staffSections(role);
 function navigate(area:StaffSection,playerId?:string,targetSessionId?:string){if(area==='organisations'&&targetSessionId==='Schedule')setOrganisationTarget(v=>({id:'',tab:'Coaching schedule',revision:v.revision+1}));if(area==="communications")setInboxTarget(v=>({tab:targetSessionId==="organisations"?"organisations":"families",revision:v.revision+1}));if(area==="attendance")area="workspace";if(!allowed.some(i=>i.id===area))return;if(playerId&&!["onboarding","sessionRequests"].includes(area))setContextPlayer(playerId);if(playerId){if(area==="onboarding"||area==="sessionRequests")setActionTarget(v=>({area,id:playerId,revision:(v?.revision||0)+1}));if(area==="coachingProfiles"){setProfilePlayerId(playerId);setProfileRequest(n=>n+1)}if(area==="familyPublishing"){setPublishingPlayerId(playerId);setPublishingRequest(n=>n+1)}if(area==="records")setCoachingTarget(previous=>({playerId,sessionId:targetSessionId||"",revision:(previous?.revision||0)+1}));if(area==="idps"){setHubPlayerId(playerId);setHubRequest(n=>n+1)}if(area==="badges"){setBadgePlayerId(playerId);setBadgeRequest(n=>n+1)}if(area==="players"){setRosterPlayerId(playerId);setRosterRequest(n=>n+1)}}if(area==="workspace"&&targetSessionId)setSessionId(targetSessionId);goTo(area);}
 function panel(id:StaffSection){switch(id){
  case "organisations":return canManage?<StaffOrganisations target={organisationTarget}/>:null;
  case "overview":return <StaffHome active={section==="overview"&&!menuOpen} canManage={canManage} onNavigate={navigate}/>;
  case "workspace":return <SessionAttendance userId={userId} initialSessionId={sessionId} onSessionChange={setSessionId} onCoachPlayer={(player,session)=>navigate("records",player,session)} onPlayerDevelopment={player=>navigate("idps",player)}/>;
  case "gallery":return <StaffMediaGallery userId={userId} canManage={canManage} initialPlayerId={contextPlayer}/>;
  case "coachingProfiles":return <StaffCoachingProfile key={userId} userId={userId} canManage={canManage} initialPlayerId={profilePlayerId} selectionRequest={profileRequest} onNavigate={navigate}/>;
  case "players":return <StaffPlayers userId={userId} canManage={canManage} initialPlayerId={rosterPlayerId} selectionRequest={rosterRequest} onNote={id=>navigate("records",id)} onDevelopment={id=>navigate("idps",id)} onBadge={id=>navigate("badges",id)} onPositions={id=>navigate("coachingProfiles",id)}/>;
  case "sessionBuilder":return <StaffSessionBuilder userId={userId} openRequest={planRequest}/>;
  case "sessions":return <TrainingPlanner userId={userId} canManage={canManage} onOpenOrganisation={id=>{setOrganisationTarget(v=>({id,tab:'Coaching schedule',revision:v.revision+1}));goTo('organisations')}} onOpenPlan={id=>{setPlanRequest(v=>({id,revision:(v?.revision||0)+1}));goTo("sessionBuilder")}}/>;
  case "attendance":return <SessionAttendance userId={userId} onCoachPlayer={(player,session)=>navigate("records",player,session)}/>;
  case "records":return <CoachingRecords key={coachingTarget?coachingTarget.playerId+":"+coachingTarget.sessionId+":"+coachingTarget.revision:"general"} userId={userId} initialPlayerId={coachingTarget?.playerId} initialSessionId={coachingTarget?.sessionId} onPositions={id=>navigate("coachingProfiles",id)} onPublish={canManage?id=>navigate("familyPublishing",id):undefined}/>;
  case "idps":return <PlayerIDP key={(hubPlayerId||"all")+":"+hubRequest} userId={userId} initialPlayerId={hubPlayerId} onAddNote={id=>navigate("records",id)} onManageGoals={id=>navigate("players",id)} onPositions={id=>navigate("coachingProfiles",id)}/>;
  case "badges":return <BadgeAwards key={(badgePlayerId||"all")+":"+badgeRequest} userId={userId} initialPlayerId={badgePlayerId}/>;
  case "trainingHub":return <PlayerTrainingHub userId={userId} role="staff" initialPlayerId={contextPlayer}/>;
  case "playerSpace":return <StaffPlayerSpaceHub userId={userId} canManage={canManage} initialPlayerId={contextPlayer}/>;
  case "communications":return canManage?<StaffInbox userId={userId} target={inboxTarget} initialPlayerId={contextPlayer} active={section==="communications"&&!menuOpen}/>:null;
  case "sessionRequests":return canManage?<SessionChangeRequests userId={userId} role="staff" onCompleteSchedule={player=>navigate("familyPublishing",player)} onOpenCalendar={()=>navigate("sessions")} initialRequestId={actionTarget?.area==="sessionRequests"?actionTarget.id:undefined} selectionRequest={actionTarget?.revision}/>:null;
  case "onboarding":return canManage?<StaffOnboarding initialIntakeId={actionTarget?.area==="onboarding"?actionTarget.id:undefined} selectionRequest={actionTarget?.revision}/>:null;
  case "admissions":return canManage?<AdmissionsManagement userId={userId}/>:null;
  case "familyPublishing":return canManage?<FamilyPublishing userId={userId} initialPlayerId={publishingPlayerId} selectionRequest={publishingRequest}/>:null;
  case "families":return canManage?<FamilyAccessAdmin userId={userId}/>:null;
  case "pathways":return canManage?<PlayerPathways userId={userId}/>:null;
  case "analytics":return canManage?<SessionAnalytics/>:null;
  case "administration":return role==="owner"?<StaffAdmin ownerId={userId}/>:null;
 }}
 return <StaffAppShell role={role} section={section} onNavigate={navigate} onSignOut={onSignOut} onMenuChange={setMenuOpen} badges={canManage?{communications:<><FamilyUnreadBadge userId={userId} role="staff"/><OrganisationInboxSummary badge/></>}:{}}>{contextPlayer&&<StaffPlayerContext playerId={contextPlayer} canManage={canManage} onNavigate={navigate} onClear={()=>setContextPlayer("")}/>} {visited.filter(id=>allowed.some(i=>i.id===id)).map(id=><section key={id} className="staff-tool-panel" hidden={section!==id} aria-label={allowed.find(i=>i.id===id)?.label}>{panel(id)}</section>)}</StaffAppShell>;
}




