"use client";
import {useState} from 'react';
import {ParentDashboard} from '../../../components/ParentDashboard';
import {ParentUpdates} from '../../../components/ParentUpdates';
import {ParentPhoneAlerts} from '../../../components/ParentPhoneAlerts';
import type {ParentUpdate} from '../../../lib/parentUpdates';
const players=[{id:'sample-player',first_name:'Alex',last_name:'Sample',programme:'prestige'},{id:'sample-sibling',first_name:'Sam',last_name:'Sample',programme:'flyers'}];
const initial:ParentUpdate[]=[
 {id:'sample-1',player_id:'sample-player',category:'session',source_kind:'session',title:'Session details changed',created_at:'2026-10-27T15:20:00Z',read_at:null},
 {id:'sample-2',player_id:'sample-sibling',category:'report',source_kind:'report',title:'Monthly report published',created_at:'2026-10-27T12:40:00Z',read_at:null},
 {id:'sample-3',player_id:'sample-player',category:'message',source_kind:'message',title:'New message from STAR',created_at:'2026-10-26T17:05:00Z',read_at:null},
 {id:'sample-4',player_id:null,category:'programme',source_kind:'programme',title:'Your programme application has an update',created_at:'2026-10-25T14:00:00Z',read_at:'2026-10-25T16:00:00Z'}
];
export default function Check(){const[items,setItems]=useState(initial);const unread=items.filter(n=>!n.read_at).length;
 return <main className="parent-page"><div className="parent-member"><ParentDashboard players={players} guardianName="Jamie Sample" goals={[]} reports={[]} assessments={[]} sessions={[]} accountContent={<p>Sample account and programme status.</p>} practiceContent={<p>Sample home practice.</p>} messagesContent={()=> <p>Sample family conversation.</p>} sessionRequestsContent={<p>Sample session requests.</p>} messageBadge={null} onRefresh={()=>{}} updateCount={unread} updateBadge={unread?<span className="parent-update-badge">{unread}</span>:null} updatesContent={onOpen=><><ParentUpdates items={items} players={players} onRefresh={()=>{}} onRead={async ids=>setItems(rows=>rows.map(n=>ids.includes(n.id)?{...n,read_at:new Date().toISOString()}:n))} onOpen={onOpen}/><ParentPhoneAlerts userKey="sample" demo/></>}/></div></main>;
}
