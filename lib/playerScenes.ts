export const illustratedScenes = [
 {key:'floodlit',title:'Floodlit stadium',description:'Big-match lights. Your own stage.'},
 {key:'street',title:'Street football',description:'Small court. Plenty of possibilities.'},
 {key:'sunset',title:'Sunset training',description:'A golden evening on the pitch.'},
 {key:'futsal',title:'Futsal arena',description:'Take your game indoors.'},
 {key:'rainy',title:'Rainy match night',description:'Floodlights, rain and football.'},
 {key:'tunnel',title:'Stadium tunnel',description:'Ready for the walk onto the pitch.'},
 {key:'graffiti',title:'Football wall',description:'A little street-art energy.'},
 {key:'star-navy',title:'STAR navy & gold',description:'Keep it clean. Make it STAR.'}
] as const;
export type IllustratedScene = typeof illustratedScenes[number]['key'];
export const sceneAsset=(key:IllustratedScene)=>`/player-space/scenes/${key}.webp`;
