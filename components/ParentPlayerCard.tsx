"use client";
import {useId,useState} from 'react';
import {badgeById} from '../lib/achievementBadges';
import type {PlayerAchievement} from '../lib/achievementBadges';
import {parentDate,type LinkedPlayer} from '../lib/parentDashboard';
import type {ParentPlayerCardData} from '../lib/parentPlayerCard';
import {Icon,Shirt} from './ParentExperienceVisuals';
import './parent-player-card.css';

export function ParentPlayerCard({player,programme,shirtName,shirtNumber,photoMode,data,photoAlt,focus,focusDetail,failed=false,onRetry,onCustomise,onDevelopment,onAchievement}:{
 player:LinkedPlayer;programme:string;shirtName:string;shirtNumber:string;photoMode:boolean;data:ParentPlayerCardData|null;
 photoAlt?:string;focus:string;focusDetail?:string;failed?:boolean;onRetry?:()=>void;onCustomise:()=>void;onDevelopment:()=>void;onAchievement:()=>void;
}){
 const titleId=useId(),[failedPhoto,setFailedPhoto]=useState('');
 const ownData=data?.player_id===player.id?data:null;
 const photo=photoMode&&ownData?.photoUrl&&failedPhoto!==ownData.photoUrl?ownData.photoUrl:null;
 const award=ownData?.award,badge=award?.badge_id?badgeById.get(award.badge_id):null;
 return <article className="ppx-player-card" aria-labelledby={titleId}>
  <div className="ppx-player-card-identity">
   <div className="ppx-player-card-name"><span className="ppx-player-card-label">YOUR STAR</span><h1 id={titleId} className="ppx-player-card-title">{player.first_name}<span>{player.last_name}</span></h1><span className="ppx-player-card-programme">{programme}</span><button className="ppx-player-card-customise" onClick={onCustomise}><Icon name="settings" size={16}/>Customise</button></div>
   <div className={`ppx-player-card-visual ${photo?'ppx-player-card-portrait':''}`}>
    {photo?<img key={photo} src={photo} alt={photoAlt||`${player.first_name}’s chosen player photo`} width={240} height={280} onError={()=>setFailedPhoto(photo)}/>:<Shirt name={shirtName} number={shirtNumber}/>}
   </div>
  </div>
  <div className="ppx-player-card-content">
   <section className="ppx-player-card-focus"><span className="ppx-player-card-label"><Icon name="spark" size={16}/>WORKING ON NOW</span>{focus?<><h2>{focus}</h2>{focusDetail&&focusDetail!==focus&&<p>{focusDetail}</p>}</>:<p>Her coaching focus will appear when STAR shares her goals.</p>}</section>
   {(ownData?.goal||award)&&<div className="ppx-player-card-highlights">
    {ownData?.goal&&<section className="ppx-player-card-goal"><span className="ppx-player-card-label"><Icon name="pin" size={16}/>HER GOAL</span><p>{ownData.goal}</p><span className="ppx-player-card-caption">Chosen in her Player Space</span></section>}
    {award&&<button className="ppx-player-card-award" onClick={onAchievement}><span className="ppx-player-card-label">LATEST ACHIEVEMENT</span><span className="ppx-player-card-award-body">{badge?<img src={badge.image} alt="" width={72} height={72}/>:<span className="ppx-player-card-award-symbol"><Icon name="star" size={32}/></span>}<span><strong>{award.title}</strong><span className="ppx-player-card-award-date">{parentDate(award.awarded_on+'T12:00:00Z',{day:'numeric',month:'short',year:'numeric'})}</span></span></span>{award.description&&<span className="ppx-player-card-award-reason">{award.description}</span>}<span className="ppx-player-card-caption">View achievement <Icon name="arrow" size={15}/></span></button>}
   </div>}
   {failed&&<p className="ppx-player-card-status" role="status">Her personal details couldn’t refresh. <button onClick={onRetry}>Try again</button></p>}
   <button className="ppx-player-card-action" onClick={onDevelopment}>View her development plan <Icon name="arrow" size={19}/></button>
  </div>
 </article>;
}

export function ParentPlayerAwardDetail({award}:{award:PlayerAchievement}){
 const badge=award.badge_id?badgeById.get(award.badge_id):null;
 return <div className="ppx-player-award-detail">{badge&&<img src={badge.image} alt={badge.title} width={180} height={180}/>}<p className="ppx-caption">Awarded {parentDate(award.awarded_on+'T12:00:00Z',{day:'numeric',month:'long',year:'numeric'})}</p>{award.description&&<p className="ppx-preserve-text">{award.description}</p>}<a className="ppx-gold-btn" href={`/player-portal?player=${encodeURIComponent(award.player_id)}#trophies`}>Open her trophy cabinet <Icon name="arrow" size={17}/></a></div>;
}
