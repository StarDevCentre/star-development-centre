"use client";
import {createContext,useContext,type ReactNode} from 'react';
import {playerExperience,type PlayerExperience} from '../lib/playerExperience';
const ExperienceContext=createContext<PlayerExperience>('teenagers');
export function PlayerExperienceProvider({experience,children}:{experience:PlayerExperience;children:ReactNode}){
 return <ExperienceContext.Provider value={playerExperience(experience)}>{children}</ExperienceContext.Provider>;
}
export function usePlayerExperience(){const experience=useContext(ExperienceContext);return {experience,isChild:experience==='children'};}
