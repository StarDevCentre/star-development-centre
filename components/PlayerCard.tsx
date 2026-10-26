"use client";
import { useEffect, useState } from 'react';
import { cosmetics, defaultProfile, type AvatarKey, type SpaceUnlock, type ProfileFields, type SpaceActions, type SpaceProfile } from '../lib/playerSpace';
import { BootSticker, PlayerDecoration, SpaceIcon } from './PlayerSpaceIcons';

const mottos = ['Your game. Your journey.', 'Small steps. Big dreams.', 'Be brave. Be you.'];
async function preparePhoto(file: File): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Choose a JPG, PNG or WebP photo under 5 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new window.Image(); image.src = url; await image.decode();
    if (image.naturalWidth * image.naturalHeight > 40000000) throw new Error('This photo is too large. Choose a smaller image.');
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
    const context = canvas.getContext('2d'); if (!context) throw new Error('Photo editing is unavailable on this device. Try an avatar instead.');
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    context.fillStyle = '#fffdf7'; context.fillRect(0, 0, 512, 512);
    context.drawImage(image, (image.naturalWidth-side)/2, (image.naturalHeight-side)/2, side, side, 0, 0, 512, 512);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', .85));
    if (!blob || blob.size > 1048576) throw new Error('Could not prepare that photo. Try a different image.');
    return blob;
  } finally { URL.revokeObjectURL(url); }
}

export function PlayerCard({ name, playerId, userKey, profile, unlocks, onUpdateProfile, demo }: { name: string; playerId: string; userKey: string; profile?: SpaceProfile; unlocks: SpaceUnlock[]; onUpdateProfile: SpaceActions['onUpdateProfile']; demo: boolean }) {
  const [editing, setEditing] = useState(false);
  const [card, setCard] = useState<ProfileFields>(defaultProfile);
  const [photo, setPhoto] = useState<Blob | null | undefined>();
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (editing) return;
    let initial: ProfileFields = { ...defaultProfile };
    if (profile) initial = { ...initial, ...profile };
    else try {
      const old = JSON.parse(localStorage.getItem(`star-player-card-v1:${userKey}:${playerId}`) || 'null');
      const accent = ({lilac:'gold',blue:'navy',coral:'red'} as Record<string,string>)[old?.accent] || old?.accent;
      if (['navy','red','gold'].includes(accent) && ['train','ball','star'].includes(old?.icon) && mottos.includes(old?.motto)) initial = { ...initial, accent: accent as ProfileFields["accent"], icon: old.icon, motto: old.motto };
    } catch { /* Legacy device preferences are optional. */ }
    setCard(initial); setPhoto(undefined); setError('');
  }, [playerId, userKey, profile, editing]);
  useEffect(() => {
    if (!photo) { setPreview(''); return; }
    const url = URL.createObjectURL(photo); setPreview(url); return () => URL.revokeObjectURL(url);
  }, [photo]);
  const image = photo === null ? '' : preview || profile?.photo_url;
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError(''); setNotice('');
    try {
      const { accent, icon, motto, shirt_name, shirt_number, ambition } = card;
      await onUpdateProfile(playerId, { accent, icon, motto, shirt_name: shirt_name.trim(), shirt_number, ambition: ambition.trim() }, photo);
      setEditing(false); setPhoto(undefined); setNotice(demo ? 'Sample card updated for this visit.' : 'Your card is saved. Open it on any device.');
    } catch(value) { setError(value instanceof Error ? value.message : 'Could not save your card. Please try again.'); }
    finally { setBusy(false); }
  }
  return <section className={`ps-player-card ps-paper ps-accent-${card.accent} ps-decoration-${profile?.decoration || "none"}`}><h2 className="ps-label">MY PLAYER CARD</h2>
    <div className="ps-shirt-heading"><p className="ps-card-name">{card.shirt_name || name}</p>{card.shirt_number !== null && <span className="ps-shirt-number" aria-label={`Shirt number ${card.shirt_number}`}>{card.shirt_number}</span>}</div>
    <div className="ps-avatar-wrap"><PlayerDecoration kind={profile?.decoration||"none"}/>{image ? <img className="ps-profile-photo" src={image} alt={`${name}'s player card portrait`}/> : card.icon === 'train' ? <BootSticker/> : <SpaceIcon className="ps-card-icon" name={card.icon}/>}<span className="ps-be-you">BE<br/>YOU!</span></div>
    <p className="ps-card-motto">{card.motto}</p>{card.ambition && <div className="ps-ambition"><strong>MY FOOTBALL DREAM</strong><p>{card.ambition}</p></div>}
    <button className="ps-text-link" disabled={busy} onClick={() => { setEditing(value => !value); setNotice(''); }} aria-expanded={editing}>{editing ? 'Close customisation' : 'Personalise your card'} <SpaceIcon name="arrow"/></button>
    {editing && <form className="ps-card-editor" onSubmit={save}><fieldset disabled={busy}><legend>Your colour</legend><div className="ps-choice-row">{(['navy','red','gold'] as const).map(value => <button type="button" aria-pressed={card.accent===value} className={`ps-colour-choice ps-swatch-${value}`} key={value} onClick={() => setCard(current => ({...current,accent:value}))}>{value}{card.accent===value && ' ✓'}</button>)}</div></fieldset>
      <fieldset disabled={busy}><legend>Your avatar</legend><div className="ps-choice-row">{(['train','ball','star','captain','comet','shield'] as AvatarKey[]).map(value => <button type="button" disabled={!["train","ball","star"].includes(value)&&!unlocks.some(u=>u.cosmetic===`avatar-${value}`)} title={cosmetics.find(c=>c.key===`avatar-${value}`)?.requirement} aria-pressed={!image && card.icon===value} aria-label={value==='train'?'Boot avatar':`${value} avatar`} key={value} onClick={() => { setPhoto(null); setCard(current => ({...current,icon:value})); }}><SpaceIcon name={value}/><small>{value==='train'?'Boot':value==='shield'?'Guardian':value}{!["train","ball","star"].includes(value)&&!unlocks.some(u=>u.cosmetic===`avatar-${value}`)?' · Locked':''}</small></button>)}</div><small>More avatars unlock through practice, goals and badges. See “Style my space” for the requirements.</small></fieldset>
      <label>Or add a profile photo<input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" onChange={async event => { const file=event.target.files?.[0]; if(!file)return; setBusy(true); setError(''); try { setPhoto(await preparePhoto(file)); } catch(value) { setError(value instanceof Error ? value.message : 'Could not open that photo.'); } finally { setBusy(false); event.target.value=''; } }}/></label><small>JPG, PNG or WebP · up to 5 MB. Your photo stays within your approved family account.</small>
      {image && <button disabled={busy} className="ps-text-link" type="button" onClick={() => setPhoto(null)}>Use avatar instead</button>}
      <label>Shirt name<input disabled={busy} maxLength={30} value={card.shirt_name} placeholder={name} onChange={event=>setCard(current=>({...current,shirt_name:event.target.value}))}/></label>
      <label>Shirt number<input disabled={busy} type="number" inputMode="numeric" min={1} max={99} step={1} value={card.shirt_number??''} placeholder="1–99" onChange={event=>setCard(current=>({...current,shirt_number:event.target.value===''?null:Number(event.target.value)}))}/></label>
      <label>My football ambitions<textarea disabled={busy} rows={3} maxLength={500} placeholder="What would you love to achieve?" value={card.ambition} onChange={event=>setCard(current=>({...current,ambition:event.target.value}))}/></label>
      <label>Your words<select disabled={busy} value={card.motto} onChange={event=>setCard(current=>({...current,motto:event.target.value}))}>{mottos.map(value=><option key={value}>{value}</option>)}</select></label>
      <button className="ps-action" disabled={busy} type="submit">{busy?'SAVING…':'SAVE MY CARD'} <SpaceIcon name="check"/></button><small>{demo?'Sample changes last for this visit.':'Saved to your player space across devices.'}</small></form>}
    {error && <p className="ps-error" role="alert">{error}</p>}{notice && <p className="ps-card-saved" role="status">{notice}</p>}
  </section>;
}
