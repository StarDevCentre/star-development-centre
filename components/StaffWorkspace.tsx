"use client";
import {useState} from "react";
import {StaffAppShell} from "./StaffAppShell";
import {useStaffNavigation} from "./useStaffNavigation";
import {staffCanManage,staffSections,type StaffRole,type StaffSection} from "../lib/staffApp";
import {StaffOnboarding} from "./StaffOnboarding";
import {StaffHome} from "./StaffHome";
import {StaffMediaGallery} from "./StaffMediaGallery";
import {StaffCoachingProfile} from "./StaffCoachingProfile";
import {StaffPlayers} from "./StaffPlayers";
import {FamilyUnreadBadge} from "./FamilyUnreadBadge";
import {BadgeAwards} from "./BadgeAwards";
import {StaffPlayerSpaceHub} from "./StaffPlayerSpaceHub";
import {PlayerTrainingHub} from "./PlayerTrainingHub";
import {SessionChangeRequests} from "./SessionChangeRequests";
import {FamilyCommunications} from "./FamilyCommunications";
import {AdmissionsManagement} from "./AdmissionsManagement";
import {FamilyPublishing} from "./FamilyPublishing";
import {FamilyAccessAdmin} from "./FamilyAccessAdmin";
import {StaffAdmin} from "./StaffAdmin";
import {TrainingPlanner} from "./TrainingPlanner";
import {SessionAttendance} from "./SessionAttendance";
import {CoachingRecords} from "./CoachingRecords";
import {PlayerIDP} from "./PlayerIDP";
import {PlayerPathways} from "./PlayerPathways";
import {SessionAnalytics} from "./SessionAnalytics";
export function StaffWorkspace({userId,role,onSignOut}:{userId:string;role:StaffRole;onSignOut:()=>void}){
 const{section,visited,goTo}=useStaffNavigation(role);const[menuOpen,setMenuOpen]=useState(false),[hubPlayerId,setHubPlayerId]=useState(""),[badgePlayerId,setBadgePlayerId]=useState(""),[rosterPlayerId,setRosterPlayerId]=useState(""),[sessionId,setSessionId]=useState(""),[rosterRequest,setRosterRequest]=useState(0),[hubRequest,setHubRequest]=useState(0),[badgeRequest,setBadgeRequest]=useState(0),[coachingTarget,setCoachingTarget]=useState<{playerId:string;sessionId:string;revision:number}|null>(null);
 const [profilePlayerId,setProfilePlayerId]=useState(""),[profileRequest,setProfileRequest]=useState(0),[publishingPlayerId,setPublishingPlayerId]=useState(""),[publishingRequest,setPublishingRequest]=useState(0);
 const [actionTarget,setActionTarget]=useState<{area:StaffSection;id:string;revision:number}|null>(null);
 const canManage=staffCanManage(role),allowed=staffSections(role);
 function navigate(area:StaffSection,playerId?:string,targetSessionId?:string){if(!allowed.some(i=>i.id===area))return;if(playerId){if(area==="onboarding"||area==="sessionRequests")setActionTarget(v=>({area,id:playerId,revision:(v?.revision||0)+1}));if(area==="coachingProfiles"){setProfilePlayerId(playerId);setProfileRequest(n=>n+1)}if(area==="familyPublishing"){setPublishingPlayerId(playerId);setPublishingRequest(n=>n+1)}if(area==="records")setCoachingTarget(previous=>({playerId,sessionId:targetSessionId||"",revision:(previous?.revision||0)+1}));if(area==="idps"){setHubPlayerId(playerId);setHubRequest(n=>n+1)}if(area==="badges"){setBadgePlayerId(playerId);setBadgeRequest(n=>n+1)}if(area==="players"){setRosterPlayerId(playerId);setRosterRequest(n=>n+1)}}if(area==="workspace"&&targetSessionId)setSessionId(targetSessionId);goTo(area);}
 function panel(id:StaffSection){switch(id){
  case "overview":return <StaffHome active={section==="overview"&&!menuOpen} canManage={canManage} onNavigate={navigate}/>;
  case "workspace":return <SessionAttendance userId={userId} initialSessionId={sessionId} onSessionChange={setSessionId} onCoachPlayer={(player,session)=>navigate("records",player,session)} onPlayerDevelopment={player=>navigate("idps",player)}/>;
  case "gallery":return <StaffMediaGallery userId={userId} canManage={canManage}/>;
  case "coachingProfiles":return <StaffCoachingProfile key={userId} userId={userId} canManage={canManage} initialPlayerId={profilePlayerId} selectionRequest={profileRequest} onNavigate={navigate}/>;
  case "players":return <StaffPlayers userId={userId} canManage={canManage} initialPlayerId={rosterPlayerId} selectionRequest={rosterRequest} onNote={id=>navigate("records",id)} onDevelopment={id=>navigate("idps",id)} onBadge={id=>navigate("badges",id)} onPositions={id=>navigate("coachingProfiles",id)}/>;
  case "sessions":return <TrainingPlanner userId={userId} canManage={canManage}/>;
  case "attendance":return <SessionAttendance userId={userId} onCoachPlayer={(player,session)=>navigate("records",player,session)}/>;
  case "records":return <CoachingRecords key={coachingTarget?coachingTarget.playerId+":"+coachingTarget.sessionId+":"+coachingTarget.revision:"general"} userId={userId} initialPlayerId={coachingTarget?.playerId} initialSessionId={coachingTarget?.sessionId} onPositions={id=>navigate("coachingProfiles",id)} onPublish={canManage?id=>navigate("familyPublishing",id):undefined}/>;
  case "idps":return <PlayerIDP key={(hubPlayerId||"all")+":"+hubRequest} userId={userId} initialPlayerId={hubPlayerId} onAddNote={id=>navigate("records",id)} onManageGoals={id=>navigate("players",id)} onPositions={id=>navigate("coachingProfiles",id)}/>;
  case "badges":return <BadgeAwards key={(badgePlayerId||"all")+":"+badgeRequest} userId={userId} initialPlayerId={badgePlayerId}/>;
  case "trainingHub":return <PlayerTrainingHub userId={userId} role="staff"/>;
  case "playerSpace":return <StaffPlayerSpaceHub userId={userId} canManage={canManage}/>;
  case "communications":return canManage?<FamilyCommunications userId={userId} role="staff" active={section==="communications"&&!menuOpen}/>:null;
  case "sessionRequests":return canManage?<SessionChangeRequests userId={userId} role="staff" initialRequestId={actionTarget?.area==="sessionRequests"?actionTarget.id:undefined} selectionRequest={actionTarget?.revision}/>:null;
  case "onboarding":return canManage?<StaffOnboarding initialIntakeId={actionTarget?.area==="onboarding"?actionTarget.id:undefined} selectionRequest={actionTarget?.revision}/>:null;
  case "admissions":return canManage?<AdmissionsManagement userId={userId}/>:null;
  case "familyPublishing":return canManage?<FamilyPublishing userId={userId} initialPlayerId={publishingPlayerId} selectionRequest={publishingRequest}/>:null;
  case "families":return canManage?<FamilyAccessAdmin userId={userId}/>:null;
  case "pathways":return canManage?<PlayerPathways userId={userId}/>:null;
  case "analytics":return canManage?<SessionAnalytics/>:null;
  case "administration":return role==="owner"?<StaffAdmin ownerId={userId}/>:null;
 }}
 return <StaffAppShell role={role} section={section} onNavigate={navigate} onSignOut={onSignOut} onMenuChange={setMenuOpen} badges={canManage?{communications:<FamilyUnreadBadge userId={userId} role="staff"/>}:{}}>{visited.filter(id=>allowed.some(i=>i.id===id)).map(id=><section key={id} className="staff-tool-panel" hidden={section!==id} aria-label={allowed.find(i=>i.id===id)?.label}>{panel(id)}</section>)}</StaffAppShell>;
}

