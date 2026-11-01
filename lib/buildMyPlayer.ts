/** A player's cosmetic choices. These are independent of her coaching records. */
export type BuilderLook = {
  skin: 'fair' | 'light' | 'medium' | 'brown' | 'deep';
  hair: 'blonde' | 'brown' | 'black' | 'ginger' | 'silver';
  hairstyle: 'ponytail' | 'curls' | 'coils' | 'braids';
  face: 'round' | 'oval' | 'freckles';
  eyes: 'brown' | 'blue' | 'green' | 'grey';
  build: 'slim' | 'standard' | 'strong';
  top: 'star' | 'navy-tee' | 'white-tee' | 'hoodie';
  bottoms: 'shorts' | 'leggings' | 'trackies';
  socks: 'white' | 'navy' | 'black';
  boots: string;
  accessory: 'none' | 'glasses' | 'headband';
};

export const defaultBuilderLook: BuilderLook = {
  skin: 'light', hair: 'brown', hairstyle: 'ponytail', face: 'oval', eyes: 'brown', build: 'standard',
  top: 'star', bottoms: 'shorts', socks: 'white', boots: 'starter', accessory: 'none',
};

export const playerPresets: Array<{ label: string; look: BuilderLook }> = [
  {label:'Alex', look: {...defaultBuilderLook}},
  {label:'Sam', look: {...defaultBuilderLook, skin:'deep',hair:'black',hairstyle:'coils',eyes:'brown'}},
  {label:'Charlie', look: {...defaultBuilderLook, skin:'medium',hair:'black',hairstyle:'braids',build:'strong'}},
  {label:'Taylor', look: {...defaultBuilderLook, skin:'fair',hair:'ginger',hairstyle:'curls',face:'freckles',eyes:'green'}},
];
