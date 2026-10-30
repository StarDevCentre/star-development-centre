import '../portal-base.css';
import {PlayerOnboarding} from '../../components/PlayerOnboarding';
import './onboarding.css';
export const metadata={title:'Join STAR · Player onboarding',description:'Create your player profile and request a free 30-minute assessment and introduction.',robots:{index:false,follow:false}};
export default function Page(){return <main className="intake-page"><header className="intake-brand"><a href="/" aria-label="STAR home"><img src="/images/star-colour-transparent.webp" alt="STAR Development Centre" width="220" height="110"/></a><a href="/parent-portal">Parent Portal ↗</a></header><div className="intake-intro"><p>YOUR FIRST STEP WITH STAR</p><h1>Let’s get to<br/><em>know her.</em></h1><p>A player profile, a conversation and a place to begin. Your 30-minute introduction and assessment is FREE.</p></div><PlayerOnboarding/></main>}
