"use client";
import {useState} from "react";
import {StaffAppShell} from "./StaffAppShell";
import {useStaffNavigation} from "./useStaffNavigation";
import {staffCanManage,staffSections,type StaffRole,type StaffSection} from "../lib/staffApp";
import {StaffHome} from "./StaffHome";
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
 const{section,visited,goTo}=useStaffNavigation(role);const[menuOpen,setMenuOpen]=useState(false),[hubPlayerId,setHubPlayerId]=useState(""),[badgePlayerId,setBadgePlayerId]=useState(""),[rosterPlayerId,setRosterPlayerId]=useState(""),[sessionId,setSessionId]=useState(""),[coachingTarget,setCoachingTarget]=useState<{playerId:string;sessionId:string}|null>(null);
 const canManage=staffCanManage(role),allowed=staffSections(role);
 function navigate(area:StaffSection,playerId?:string,targetSessionId?:string){if(!allowed.some(i=>i.id===area))return;if(playerId){if(area==="records")setCoachingTarget({playerId,sessionId:targetSessionId||""});if(area==="idps")setHubPlayerId(playerId);if(area==="badges")setBadgePlayerId(playerId);if(area==="players")setRosterPlayerId(playerId)}if(area==="workspace"&&targetSessionId)setSessionId(targetSessionId);goTo(area);}
 function panel(id:StaffSection){switch(id){
  case "overview":return <StaffHome active={section==="overview"&&!menuOpen} canManage={canManage} onNavigate={navigate}/>;
  case "workspace":return <SessionAttendance userId={userId} initialSessionId={sessionId} onSessionChange={setSessionId} onCoachPlayer={(player,session)=>navigate("records",player,session)} onPlayerDevelopment={player=>navigate("idps",player)}/>;
  case "players":return <StaffPlayers userId={userId} canManage={canManage} initialPlayerId={rosterPlayerId} onNote={id=>navigate("records",id)} onDevelopment={id=>navigate("idps",id)} onBadge={id=>navigate("badges",id)}/>;
  case "sessions":return <TrainingPlanner userId={userId} canManage={canManage}/>;
  case "attendance":return <SessionAttendance userId={userId} onCoachPlayer={(player,session)=>navigate("records",player,session)}/>;
  case "records":return <CoachingRecords key={coachingTarget?coachingTarget.playerId+":"+coachingTarget.sessionId:"general"} userId={userId} initialPlayerId={coachingTarget?.playerId} initialSessionId={coachingTarget?.sessionId}/>;
  case "idps":return <PlayerIDP key={hubPlayerId||"all"} userId={userId} initialPlayerId={hubPlayerId} onAddNote={id=>navigate("records",id)} onManageGoals={id=>navigate("players",id)}/>;
  case "badges":return <BadgeAwards key={badgePlayerId||"all"} userId={userId} initialPlayerId={badgePlayerId}/>;
  case "trainingHub":return <PlayerTrainingHub userId={userId} role="staff"/>;
  case "playerSpace":return <StaffPlayerSpaceHub userId={userId} canManage={canManage}/>;
  case "communications":return canManage?<FamilyCommunications userId={userId} role="staff" active={section==="communications"&&!menuOpen}/>:null;
  case "sessionRequests":return canManage?<SessionChangeRequests userId={userId} role="staff"/>:null;
  case "admissions":return canManage?<AdmissionsManagement userId={userId}/>:null;
  case "familyPublishing":return canManage?<FamilyPublishing userId={userId}/>:null;
  case "families":return canManage?<FamilyAccessAdmin userId={userId}/>:null;
  case "pathways":return canManage?<PlayerPathways userId={userId}/>:null;
  case "analytics":return canManage?<SessionAnalytics/>:null;
  case "administration":return role==="owner"?<StaffAdmin ownerId={userId}/>:null;
 }}
 return <StaffAppShell role={role} section={section} onNavigate={navigate} onSignOut={onSignOut} onMenuChange={setMenuOpen} badges={canManage?{communications:<FamilyUnreadBadge userId={userId} role="staff"/>}:{}}>{visited.filter(id=>allowed.some(i=>i.id===id)).map(id=><section key={id} className="staff-tool-panel" hidden={section!==id} aria-label={allowed.find(i=>i.id===id)?.label}>{panel(id)}</section>)}</StaffAppShell>;
}
