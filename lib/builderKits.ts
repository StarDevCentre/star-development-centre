/** Current league membership checked against WSL Football on 1 November 2026. */
export const builderKits = [
 {
  "id": "arsenal",
  "club": "Arsenal",
  "league": "WSL",
  "sockColour": [
   245,
   245,
   242
  ]
 },
 {
  "id": "aston-villa",
  "club": "Aston Villa",
  "league": "WSL",
  "sockColour": [
   170,
   210,
   230
  ]
 },
 {
  "id": "birmingham",
  "club": "Birmingham City",
  "league": "WSL",
  "sockColour": [
   25,
   67,
   170
  ]
 },
 {
  "id": "brighton",
  "club": "Brighton & Hove Albion",
  "league": "WSL",
  "sockColour": [
   25,
   70,
   172
  ]
 },
 {
  "id": "charlton",
  "club": "Charlton Athletic",
  "league": "WSL",
  "sockColour": [
   187,
   24,
   41
  ]
 },
 {
  "id": "chelsea",
  "club": "Chelsea",
  "league": "WSL",
  "sockColour": [
   244,
   245,
   240
  ]
 },
 {
  "id": "crystal-palace",
  "club": "Crystal Palace",
  "league": "WSL",
  "sockColour": [
   244,
   245,
   242
  ]
 },
 {
  "id": "everton",
  "club": "Everton",
  "league": "WSL",
  "sockColour": [
   29,
   62,
   150
  ]
 },
 {
  "id": "liverpool",
  "club": "Liverpool",
  "league": "WSL",
  "sockColour": [
   175,
   25,
   40
  ]
 },
 {
  "id": "london-city",
  "club": "London City Lionesses",
  "league": "WSL",
  "sockColour": [
   23,
   40,
   65
  ]
 },
 {
  "id": "manchester-city",
  "club": "Manchester City",
  "league": "WSL",
  "sockColour": [
   181,
   218,
   239
  ]
 },
 {
  "id": "manchester-united",
  "club": "Manchester United",
  "league": "WSL",
  "sockColour": [
   28,
   29,
   34
  ]
 },
 {
  "id": "tottenham",
  "club": "Tottenham Hotspur",
  "league": "WSL",
  "sockColour": [
   244,
   245,
   242
  ]
 },
 {
  "id": "west-ham",
  "club": "West Ham United",
  "league": "WSL",
  "sockColour": [
   244,
   245,
   242
  ]
 },
 {
  "id": "bristol-city",
  "club": "Bristol City",
  "league": "WSL2",
  "sockColour": [
   117,
   30,
   46
  ]
 },
 {
  "id": "burnley",
  "club": "Burnley",
  "league": "WSL2",
  "sockColour": [
   102,
   28,
   48
  ]
 },
 {
  "id": "durham",
  "club": "Durham",
  "league": "WSL2",
  "sockColour": [
   30,
   80,
   155
  ]
 },
 {
  "id": "ipswich",
  "club": "Ipswich Town",
  "league": "WSL2",
  "sockColour": [
   27,
   62,
   151
  ]
 },
 {
  "id": "leicester",
  "club": "Leicester City",
  "league": "WSL2",
  "sockColour": [
   31,
   63,
   154
  ]
 },
 {
  "id": "newcastle",
  "club": "Newcastle United",
  "league": "WSL2",
  "sockColour": [
   27,
   28,
   34
  ]
 },
 {
  "id": "nottingham-forest",
  "club": "Nottingham Forest",
  "league": "WSL2",
  "sockColour": [
   183,
   30,
   43
  ]
 },
 {
  "id": "sheffield-united",
  "club": "Sheffield United",
  "league": "WSL2",
  "sockColour": [
   183,
   24,
   40
  ]
 },
 {
  "id": "southampton",
  "club": "Southampton",
  "league": "WSL2",
  "sockColour": [
   244,
   245,
   242
  ]
 },
 {
  "id": "sunderland",
  "club": "Sunderland",
  "league": "WSL2",
  "sockColour": [
   28,
   29,
   34
  ],
  "launchVersion": true
 },
 {
  "id": "watford",
  "club": "Watford",
  "league": "WSL2",
  "sockColour": [
   238,
   196,
   30
  ],
  "launchVersion": true
 },
 {
  "id": "wolves",
  "club": "Wolverhampton Wanderers",
  "league": "WSL2",
  "sockColour": [
   221,
   154,
   28
  ]
 }
] as const;
export type BuilderKitId = `home-2627-${(typeof builderKits)[number]["id"]}`;
export const builderKitOptions=builderKits.map(k=>(`home-2627-${k.id}`) as BuilderKitId);
export function builderKit(value:string){const id=value==='arsenal'||value==='chelsea'?value:value.startsWith('home-2627-')?value.slice(10):'';return builderKits.find(k=>k.id===id);}
export function builderKitLabel(value:string){const kit=builderKit(value);return kit?`${kit.club} home · 2026/27${'launchVersion' in kit?' · launch':''}`:value;}
export function builderKitAsset(id:string,part:'top'|'bottoms'|'socks',view:'front'|'back'){return `/player-space/builder/kits/${id}-${part}-${view}.webp`;}
