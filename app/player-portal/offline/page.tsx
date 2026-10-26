import Link from 'next/link';
export default function PlayerOffline(){return <section style={{padding:'60px 25px',maxWidth:700,margin:'auto'}}><h1>You’re offline.</h1><p>Reconnect to open your latest sessions, conversations and player records.</p><Link href="/player-portal">Try Player Space again →</Link></section>;}
