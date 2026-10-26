export const heroSkinTones = [
  { key: 'fair', label: 'Fair', colour: '#edc4a8', shadow: [112,67,52], mid: [230,177,145], light: [255,239,218] },
  { key: 'light', label: 'Light', colour: '#e9a070', shadow: [125,63,37], mid: [235,151,96], light: [255,234,187] },
  { key: 'medium', label: 'Medium', colour: '#bb8058', shadow: [83,43,30], mid: [183,119,79], light: [244,206,162] },
  { key: 'brown', label: 'Brown', colour: '#8b573c', shadow: [49,27,23], mid: [131,78,52], light: [211,160,114] },
  { key: 'deep', label: 'Deep', colour: '#593c30', shadow: [26,19,18], mid: [80,47,35], light: [165,116,83] },
] as const;
export const heroHairColours = [
  { key: 'blonde', label: 'Blonde', colour: '#e5b660', shadow: [58,30,20], mid: [181,126,49], light: [255,239,177] },
  { key: 'brown', label: 'Brown', colour: '#704528', shadow: [17,12,12], mid: [84,46,27], light: [184,131,81] },
  { key: 'black', label: 'Black', colour: '#242331', shadow: [6,7,12], mid: [31,28,37], light: [119,124,144] },
  { key: 'ginger', label: 'Ginger', colour: '#b75529', shadow: [41,16,12], mid: [163,61,25], light: [255,190,110] },
  { key: 'silver', label: 'Silver', colour: '#c6cad8', shadow: [36,37,49], mid: [134,141,158], light: [253,251,255] },
] as const;
export const heroHairTypes = [
  { key: 'ponytail', label: 'Wavy ponytail', asset: '/player-space/hero-player-star-kit.webp' },
  { key: 'curls', label: 'Loose curls', asset: '/player-space/hero-curls.webp' },
  { key: 'coils', label: 'Coily puff', asset: '/player-space/hero-coils.webp' },
  { key: 'braids', label: 'Braided ponytail', asset: '/player-space/hero-braids.webp' },
] as const;
export type HeroAppearance = {
  hero_skin: typeof heroSkinTones[number]['key'];
  hero_hair_colour: typeof heroHairColours[number]['key'];
  hero_hair_type: typeof heroHairTypes[number]['key'];
};
export const defaultHero: HeroAppearance = {hero_skin:'light',hero_hair_colour:'blonde',hero_hair_type:'ponytail'};
export function heroAppearance(value?: Partial<HeroAppearance>):HeroAppearance {
  return {
    hero_skin:heroSkinTones.some(t=>t.key===value?.hero_skin)?value!.hero_skin!:defaultHero.hero_skin,
    hero_hair_colour:heroHairColours.some(t=>t.key===value?.hero_hair_colour)?value!.hero_hair_colour!:defaultHero.hero_hair_colour,
    hero_hair_type:heroHairTypes.some(t=>t.key===value?.hero_hair_type)?value!.hero_hair_type!:defaultHero.hero_hair_type,
  };
}
