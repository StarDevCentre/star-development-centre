import {cosmetics} from './playerSpace';
import {learningRewards,learningHairstyles,extraKey} from './learningRewards';
export const styleExtraKeys=[...new Set([...cosmetics.map(c=>c.key),...learningRewards.map(extraKey),...learningHairstyles.map(h=>'hair-'+h.key)])];
export function styleExtraCounts(unlocks:{cosmetic:string}[]){const keys=new Set(unlocks.map(u=>u.cosmetic));return {unlocked:styleExtraKeys.filter(k=>keys.has(k)).length,total:styleExtraKeys.length};}
