export type LearningArticle = {
  id: string;
  title: string;
  category: 'positions' | 'tactics' | 'stories' | 'goalkeeping' | 'players' | 'clubs' | 'international';
  level: 'all' | 'senior';
  summary: string;
  body: string[];
  takeaway: string;
  source: { label: string; url: string }[];
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  level: 'all' | 'senior';
  source: { label: string; url: string };
};

// Original player-facing summaries. Sources support the football principles and
// historical facts; reflection prompts are STAR learning suggestions.
const sources = {
  goalkeeper: {
    label: 'FIFA Training Centre — goalkeepers supporting the build-up',
    url: 'https://www.fifatrainingcentre.com/en/practice/elite-sessions/goalkeeper/goalkeepersbuildup.php',
  },
  defenders: {
    label: 'FIFA Training Centre — defending with a back four',
    url: 'https://www.fifatrainingcentre.com/en/practice/elite-sessions/out-of-possession/defending-with-a-back-four.php',
  },
  midfielder: {
    label: 'FIFA Training Centre — understanding position-specific roles',
    url: 'https://www.fifatrainingcentre.com/en/practice/talent-coach-programme/position-specific-training/developing-players-using-position-specific-training.php',
  },
  forward: {
    label: 'FIFA Training Centre — receiving before finishing',
    url: 'https://www.fifatrainingcentre.com/en/practice/talent-coach-programme/create-and-finish/finishing-offering-to-receive-and-score.php',
  },
  scanning: {
    label: 'FIFA Training Centre — scanning to play forward',
    url: 'https://www.fifatrainingcentre.com/en/practice/grassroots/global-grassroots-insights/christchurch-united.php',
  },
  support: {
    label: 'FIFA Training Centre — support and movement away from the ball',
    url: 'https://www.fifatrainingcentre.com/en/practice/talent-coach-programme/sessions/support-and-off-the-ball-movements.php',
  },
  pressing: {
    label: 'FIFA Training Centre — defending as a unit',
    url: 'https://www.fifatrainingcentre.com/en/practice/elite-sessions/out-of-possession/defending-as-a-unit.php',
  },
  earps: {
    label: 'England Football — Mary Earps and her 2023 achievements',
    url: 'https://www.englandfootball.com/articles/2023/Sep/19/mary-earps-wins-england-womens-player-of-the-year-2023-20231909',
  },
  williamson: {
    label: 'England Football — Leah Williamson player profile',
    url: 'https://www.englandfootball.com/england/womens-senior-team/squad/leah-williamson',
  },
  shaw: {
    label: 'Manchester City — Bunny Shaw helps Jamaica qualify for the 2023 World Cup',
    url: 'https://www.mancity.com/news/womens/khadija-shaw-jamaica-haiti-63793217',
  },
};

export const learningArticles: LearningArticle[] = [
  {"id":"wsl-club-arsenal","title":"Arsenal Women: Club Spotlight","category":"clubs","level":"all","summary":"Meet Arsenal and turn watching WSL football into a mini coaching session.","body":["CLUB IDENTITY: Arsenal are known as The Gunners. Arsenal were among the eight founding WSL clubs in 2011. They won the first two WSL titles, in 2011 and 2012, and another in 2018/19.","DID YOU KNOW? Arsenal and Chelsea are the only clubs to have appeared in every WSL season from 2011 through 2026/27.","YOUR CLUB DETECTIVE MISSION: Try finding the difference between Arsenal's home and away passing choices. Compare what you notice with the learning activity below.","THE CLUB: Arsenal represents north London in the 2026/27 Women's Super League. WSL matches are a chance to watch talented players solve real problems under pressure.","YOUR WATCHING MISSION: Explore quick combinations around the box. This is a way to study the game, not a claim that the team uses only one style: tactics change from match to match.","LOOK AGAIN: Pick one passage of play and spot a midfielder checking into space. What happened before the movement? Did it give a teammate more time or space?","TRY IT YOURSELF: Set up three cones in a triangle with two partners. Pass, move to a fresh angle and call or signal when you're available. Add a gentle defender if everyone is comfortable.","KEEP IT REAL: Pro football moves quickly. Start at your own pace, learn the decision and build up from there. A smart pass or helpful run counts even if it doesn't end in a goal."],"takeaway":"YOUR CHALLENGE: Watch ten minutes of Arsenal and spot one useful off-ball action.","source":[{"label":"WSL Football — official competition","url":"https://www.wslfootball.com/"}]},
  {"id":"wsl-club-aston-villa","title":"Aston Villa Women: Club Spotlight","category":"clubs","level":"all","summary":"Meet Aston Villa and turn watching WSL football into a mini coaching session.","body":["CLUB IDENTITY: Aston Villa are known as The Villans. Villa won the second-tier women's title in 2019/20 to reach the WSL. Their women's side has played in the top division since 2020.","DID YOU KNOW? Villa's promotion came just before the WSL grew into an increasingly high-profile professional competition.","YOUR CLUB DETECTIVE MISSION: Look for the way Villa players connect the midfield to the forwards. Compare what you notice with the learning activity below.","THE CLUB: Aston Villa represents Birmingham in the 2026/27 Women's Super League. WSL matches are a chance to watch talented players solve real problems under pressure.","YOUR WATCHING MISSION: Explore support between defence and attack. This is a way to study the game, not a claim that the team uses only one style: tactics change from match to match.","LOOK AGAIN: Pick one passage of play and spot a player moving to help the ball carrier. What happened before the movement? Did it give a teammate more time or space?","TRY IT YOURSELF: Set up three cones in a triangle with two partners. Pass, move to a fresh angle and call or signal when you're available. Add a gentle defender if everyone is comfortable.","KEEP IT REAL: Pro football moves quickly. Start at your own pace, learn the decision and build up from there. A smart pass or helpful run counts even if it doesn't end in a goal."],"takeaway":"YOUR CHALLENGE: Watch ten minutes of Aston Villa and spot one useful off-ball action.","source":[{"label":"WSL Football — official competition","url":"https://www.wslfootball.com/"}]},
  {"id":"wsl-club-birmingham-city","title":"Birmingham City Women: Club Spotlight","category":"clubs","level":"all","summary":"Meet Birmingham City and turn watching WSL football into a mini coaching session.","body":["CLUB IDENTITY: Birmingham City are known as The Blues. Birmingham were founding members of the WSL in 2011. They dropped out in 2022 but won WSL2 in 2025/26 to return four years later.","DID YOU KNOW? Their promotion was sealed with a decisive victory over Charlton Athletic on the final day of the 2025/26 season.","YOUR CLUB DETECTIVE MISSION: Notice how a promoted team deals with fast attacking opponents. Compare what you notice with the learning activity below.","THE CLUB: Birmingham City represents Birmingham in the 2026/27 Women's Super League. WSL matches are a chance to watch talented players solve real problems under pressure.","YOUR WATCHING MISSION: Explore how a team adjusts to strong opponents. This is a way to study the game, not a claim that the team uses only one style: tactics change from match to match.","LOOK AGAIN: Pick one passage of play and spot defenders talking and covering. What happened before the movement? Did it give a teammate more time or space?","TRY IT YOURSELF: Set up three cones in a triangle with two partners. Pass, move to a fresh angle and call or signal when you're available. Add a gentle defender if everyone is comfortable.","KEEP IT REAL: Pro football moves quickly. Start at your own pace, learn the decision and build up from there. A smart pass or helpful run counts even if it doesn't end in a goal."],"takeaway":"YOUR CHALLENGE: Watch ten minutes of Birmingham City and spot one useful off-ball action.","source":[{"label":"WSL Football — official competition","url":"https://www.wslfootball.com/"}]},
  {"id":"wsl-club-brighton-hove-albion","title":"Brighton & Hove Albion Women: Club Spotlight","category":"clubs","level":"all","summary":"Meet Brighton & Hove Albion and turn watching WSL football into a mini coaching session.","body":["CLUB IDENTITY: Brighton & Hove Albion are known as The Seagulls. Brighton joined the WSL in 2018. The club represents the Sussex coast, and its women's team has become an established top-flight presence.","DID YOU KNOW? Brighton's nickname, the Seagulls, reflects the club's coastal identity.","YOUR CLUB DETECTIVE MISSION: Watch how a wide player creates room for an overlapping teammate. Compare what you notice with the learning activity below.","THE CLUB: Brighton & Hove Albion represents the south coast in the 2026/27 Women's Super League. WSL matches are a chance to watch talented players solve real problems under pressure.","YOUR WATCHING MISSION: Explore creating width and passing options. This is a way to study the game, not a claim that the team uses only one style: tactics change from match to match.","LOOK AGAIN: Pick one passage of play and spot a winger staying wide to stretch the pitch. What happened before the movement? Did it give a teammate more time or space?","TRY IT YOURSELF: Set up three cones in a triangle with two partners. Pass, move to a fresh angle and call or signal when you're available. Add a gentle defender if everyone is comfortable.","KEEP IT REAL: Pro football moves quickly. Start at your own pace, learn the decision and build up from there. A smart pass or helpful run counts even if it doesn't end in a goal."],"takeaway":"YOUR CHALLENGE: Watch ten minutes of Brighton & Hove Albion and spot one useful off-ball action.","source":[{"label":"WSL Football — official competition","url":"https://www.wslfootball.com/"}]},
  {"id":"wsl-club-charlton-athletic","title":"Charlton Athletic Women: Club Spotlight","category":"clubs","level":"all","summary":"Meet Charlton Athletic and turn watching WSL football into a mini coaching session.","body":["CLUB IDENTITY: Charlton Athletic are known as The Addicks. Charlton made their WSL debut in 2026/27 after coming through the promotion play-off. Their rise gave the expanded league another south-east London club.","DID YOU KNOW? Charlton were the only one of the 21 clubs to have appeared in the WSL by October 2026 that had played just one WSL season.","YOUR CLUB DETECTIVE MISSION: Look for how a newcomer adjusts its shape when possession changes. Compare what you notice with the learning activity below.","THE CLUB: Charlton Athletic represents south-east London in the 2026/27 Women's Super League. WSL matches are a chance to watch talented players solve real problems under pressure.","YOUR WATCHING MISSION: Explore staying organised when play changes. This is a way to study the game, not a claim that the team uses only one style: tactics change from match to match.","LOOK AGAIN: Pick one passage of play and spot the first defensive reaction after losing possession. What happened before the movement? Did it give a teammate more time or space?","TRY IT YOURSELF: Set up three cones in a triangle with two partners. Pass, move to a fresh angle and call or signal when you're available. Add a gentle defender if everyone is comfortable.","KEEP IT REAL: Pro football moves quickly. Start at your own pace, learn the decision and build up from there. A smart pass or helpful run counts even if it doesn't end in a goal."],"takeaway":"YOUR CHALLENGE: Watch ten minutes of Charlton Athletic and spot one useful off-ball action.","source":[{"label":"WSL Football — official competition","url":"https://www.wslfootball.com/"}]},
  {"id":"wsl-club-chelsea","title":"Chelsea Women: Club Spotlight","category":"clubs","level":"all","summary":"Meet Chelsea and turn watching WSL football into a mini coaching session.","body":["CLUB IDENTITY: Chelsea are known as The Blues. Chelsea have been in every WSL season since 2011 and won eight league titles by 2025, including six consecutive championships from 2019/20 to 2024/25.","DID YOU KNOW? Chelsea completed an unbeaten WSL league season in 2024/25, an achievement often described as an invincible campaign.","YOUR CLUB DETECTIVE MISSION: See how attackers rotate positions to give defenders difficult decisions. Compare what you notice with the learning activity below.","THE CLUB: Chelsea represents west London in the 2026/27 Women's Super League. WSL matches are a chance to watch talented players solve real problems under pressure.","YOUR WATCHING MISSION: Explore different ways of creating chances. This is a way to study the game, not a claim that the team uses only one style: tactics change from match to match.","LOOK AGAIN: Pick one passage of play and spot a forward changing direction to find space. What happened before the movement? Did it give a teammate more time or space?","TRY IT YOURSELF: Set up three cones in a triangle with two partners. Pass, move to a fresh angle and call or signal when you're available. Add a gentle defender if everyone is comfortable.","KEEP IT REAL: Pro football moves quickly. Start at your own pace, learn the decision and build up from there. A smart pass or helpful run counts even if it doesn't end in a goal."],"takeaway":"YOUR CHALLENGE: Watch ten minutes of Chelsea and spot one useful off-ball action.","source":[{"label":"WSL Football — official competition","url":"https://www.wslfootball.com/"}]},
  {"id":"wsl-club-crystal-palace","title":"Crystal Palace Women: Club Spotlight","category":"clubs","level":"all","summary":"Meet Crystal Palace and turn watching WSL football into a mini coaching session.","body":["CLUB IDENTITY: Crystal Palace are known as The Eagles. Palace won WSL2 in 2023/24, played their first WSL season in 2024/25 and returned to the top flight for 2026/27 after a season away.","DID YOU KNOW? They sealed that return with a 6–1 victory over Portsmouth on the final day of 2025/26.","YOUR CLUB DETECTIVE MISSION: Watch how defenders protect the centre when opponents attack wide. Compare what you notice with the learning activity below.","THE CLUB: Crystal Palace represents south London in the 2026/27 Women's Super League. WSL matches are a chance to watch talented players solve real problems under pressure.","YOUR WATCHING MISSION: Explore defensive teamwork and bravery. This is a way to study the game, not a claim that the team uses only one style: tactics change from match to match.","LOOK AGAIN: Pick one passage of play and spot a player protecting space behind a teammate. What happened before the movement? Did it give a teammate more time or space?","TRY IT YOURSELF: Set up three cones in a triangle with two partners. Pass, move to a fresh angle and call or signal when you're available. Add a gentle defender if everyone is comfortable.","KEEP IT REAL: Pro football moves quickly. Start at your own pace, learn the decision and build up from there. A smart pass or helpful run counts even if it doesn't end in a goal."],"takeaway":"YOUR CHALLENGE: Watch ten minutes of Crystal Palace and spot one useful off-ball action.","source":[{"label":"WSL Football — official competition","url":"https://www.wslfootball.com/"}]},
  {"id":"wsl-club-everton","title":"Everton Women: Club Spotlight","category":"clubs","level":"all","summary":"Meet Everton and turn watching WSL football into a mini coaching session.","body":["CLUB IDENTITY: Everton are known as The Toffees. Everton were one of the eight original WSL clubs in 2011. Their women's side has a long history in England's top levels of football.","DID YOU KNOW? Everton featured in the first WSL season, left the division after 2014 and returned in 2017.","YOUR CLUB DETECTIVE MISSION: Notice the first decision after Everton regain possession. Compare what you notice with the learning activity below.","THE CLUB: Everton represents Liverpool in the 2026/27 Women's Super League. WSL matches are a chance to watch talented players solve real problems under pressure.","YOUR WATCHING MISSION: Explore winning the ball and attacking quickly. This is a way to study the game, not a claim that the team uses only one style: tactics change from match to match.","LOOK AGAIN: Pick one passage of play and spot the first pass after a regain. What happened before the movement? Did it give a teammate more time or space?","TRY IT YOURSELF: Set up three cones in a triangle with two partners. Pass, move to a fresh angle and call or signal when you're available. Add a gentle defender if everyone is comfortable.","KEEP IT REAL: Pro football moves quickly. Start at your own pace, learn the decision and build up from there. A smart pass or helpful run counts even if it doesn't end in a goal."],"takeaway":"YOUR CHALLENGE: Watch ten minutes of Everton and spot one useful off-ball action.","source":[{"label":"WSL Football — official competition","url":"https://www.wslfootball.com/"}]},
  {"id":"wsl-club-liverpool","title":"Liverpool Women: Club Spotlight","category":"clubs","level":"all","summary":"Meet Liverpool and turn watching WSL football into a mini coaching session.","body":["CLUB IDENTITY: Liverpool are known as The Reds. Liverpool were founding WSL members and became champions in both 2013 and 2014, winning back-to-back league titles.","DID YOU KNOW? Those two consecutive titles came between Arsenal's early WSL success and the later dominance of Chelsea.","YOUR CLUB DETECTIVE MISSION: Find one run that creates a passing lane without the runner receiving. Compare what you notice with the learning activity below.","THE CLUB: Liverpool represents Merseyside in the 2026/27 Women's Super League. WSL matches are a chance to watch talented players solve real problems under pressure.","YOUR WATCHING MISSION: Explore communication and coordinated movement. This is a way to study the game, not a claim that the team uses only one style: tactics change from match to match.","LOOK AGAIN: Pick one passage of play and spot a clear call before receiving. What happened before the movement? Did it give a teammate more time or space?","TRY IT YOURSELF: Set up three cones in a triangle with two partners. Pass, move to a fresh angle and call or signal when you're available. Add a gentle defender if everyone is comfortable.","KEEP IT REAL: Pro football moves quickly. Start at your own pace, learn the decision and build up from there. A smart pass or helpful run counts even if it doesn't end in a goal."],"takeaway":"YOUR CHALLENGE: Watch ten minutes of Liverpool and spot one useful off-ball action.","source":[{"label":"WSL Football — official competition","url":"https://www.wslfootball.com/"}]},
  {"id":"wsl-club-london-city-lionesses","title":"London City Lionesses Women: Club Spotlight","category":"clubs","level":"all","summary":"Meet London City Lionesses and turn watching WSL football into a mini coaching session.","body":["CLUB IDENTITY: London City Lionesses are known as The Lionesses. London City Lionesses are a standalone women's football club rather than the women's team of a men's Premier League side. They won WSL2 in 2024/25 and entered the top division in 2025/26.","DID YOU KNOW? Their separate identity makes them an unusual club in the WSL.","YOUR CLUB DETECTIVE MISSION: Notice how players build passing connections across the team. Compare what you notice with the learning activity below.","THE CLUB: London City Lionesses represents south-east London in the 2026/27 Women's Super League. WSL matches are a chance to watch talented players solve real problems under pressure.","YOUR WATCHING MISSION: Explore building connections across a team. This is a way to study the game, not a claim that the team uses only one style: tactics change from match to match.","LOOK AGAIN: Pick one passage of play and spot the player offering a safe supporting angle. What happened before the movement? Did it give a teammate more time or space?","TRY IT YOURSELF: Set up three cones in a triangle with two partners. Pass, move to a fresh angle and call or signal when you're available. Add a gentle defender if everyone is comfortable.","KEEP IT REAL: Pro football moves quickly. Start at your own pace, learn the decision and build up from there. A smart pass or helpful run counts even if it doesn't end in a goal."],"takeaway":"YOUR CHALLENGE: Watch ten minutes of London City Lionesses and spot one useful off-ball action.","source":[{"label":"WSL Football — official competition","url":"https://www.wslfootball.com/"}]},
  {"id":"wsl-club-manchester-city","title":"Manchester City Women: Club Spotlight","category":"clubs","level":"all","summary":"Meet Manchester City and turn watching WSL football into a mini coaching session.","body":["CLUB IDENTITY: Manchester City are known as The Citizens. Manchester City joined the WSL in 2014, won their first league title in 2016 and became champions again in 2025/26.","DID YOU KNOW? Their 2025/26 championship ended a ten-year wait for another WSL league title.","YOUR CLUB DETECTIVE MISSION: Count how many passing options the ball carrier has before a forward pass. Compare what you notice with the learning activity below.","THE CLUB: Manchester City represents Manchester in the 2026/27 Women's Super League. WSL matches are a chance to watch talented players solve real problems under pressure.","YOUR WATCHING MISSION: Explore passing triangles and patient build-up. This is a way to study the game, not a claim that the team uses only one style: tactics change from match to match.","LOOK AGAIN: Pick one passage of play and spot how many options the player on the ball has. What happened before the movement? Did it give a teammate more time or space?","TRY IT YOURSELF: Set up three cones in a triangle with two partners. Pass, move to a fresh angle and call or signal when you're available. Add a gentle defender if everyone is comfortable.","KEEP IT REAL: Pro football moves quickly. Start at your own pace, learn the decision and build up from there. A smart pass or helpful run counts even if it doesn't end in a goal."],"takeaway":"YOUR CHALLENGE: Watch ten minutes of Manchester City and spot one useful off-ball action.","source":[{"label":"WSL Football — official competition","url":"https://www.wslfootball.com/"}]},
  {"id":"wsl-club-manchester-united","title":"Manchester United Women: Club Spotlight","category":"clubs","level":"all","summary":"Meet Manchester United and turn watching WSL football into a mini coaching session.","body":["CLUB IDENTITY: Manchester United are known as The Red Devils. Manchester United's modern women's first team began competing in 2018/19. They won the second-tier title immediately and entered the WSL in 2019.","DID YOU KNOW? United reached the top division at the first attempt, a rapid rise for the newly formed senior side.","YOUR CLUB DETECTIVE MISSION: Watch the timing of a forward run as a midfielder looks up. Compare what you notice with the learning activity below.","THE CLUB: Manchester United represents Greater Manchester in the 2026/27 Women's Super League. WSL matches are a chance to watch talented players solve real problems under pressure.","YOUR WATCHING MISSION: Explore changing attacking speed. This is a way to study the game, not a claim that the team uses only one style: tactics change from match to match.","LOOK AGAIN: Pick one passage of play and spot a forward run timed with a teammate's pass. What happened before the movement? Did it give a teammate more time or space?","TRY IT YOURSELF: Set up three cones in a triangle with two partners. Pass, move to a fresh angle and call or signal when you're available. Add a gentle defender if everyone is comfortable.","KEEP IT REAL: Pro football moves quickly. Start at your own pace, learn the decision and build up from there. A smart pass or helpful run counts even if it doesn't end in a goal."],"takeaway":"YOUR CHALLENGE: Watch ten minutes of Manchester United and spot one useful off-ball action.","source":[{"label":"WSL Football — official competition","url":"https://www.wslfootball.com/"}]},
  {"id":"wsl-club-tottenham-hotspur","title":"Tottenham Hotspur Women: Club Spotlight","category":"clubs","level":"all","summary":"Meet Tottenham Hotspur and turn watching WSL football into a mini coaching session.","body":["CLUB IDENTITY: Tottenham Hotspur are known as Spurs. Tottenham entered the WSL in 2019 after rising through the women's football pyramid. Their north London rivalry with Arsenal adds extra attention to derby matches.","DID YOU KNOW? Spurs and Arsenal play a women's north London derby, one of the league's notable local rivalries.","YOUR CLUB DETECTIVE MISSION: Spot a wide player whose movement opens space for a teammate. Compare what you notice with the learning activity below.","THE CLUB: Tottenham Hotspur represents north London in the 2026/27 Women's Super League. WSL matches are a chance to watch talented players solve real problems under pressure.","YOUR WATCHING MISSION: Explore wide play and supporting runs. This is a way to study the game, not a claim that the team uses only one style: tactics change from match to match.","LOOK AGAIN: Pick one passage of play and spot an overlap that creates a passing option. What happened before the movement? Did it give a teammate more time or space?","TRY IT YOURSELF: Set up three cones in a triangle with two partners. Pass, move to a fresh angle and call or signal when you're available. Add a gentle defender if everyone is comfortable.","KEEP IT REAL: Pro football moves quickly. Start at your own pace, learn the decision and build up from there. A smart pass or helpful run counts even if it doesn't end in a goal."],"takeaway":"YOUR CHALLENGE: Watch ten minutes of Tottenham Hotspur and spot one useful off-ball action.","source":[{"label":"WSL Football — official competition","url":"https://www.wslfootball.com/"}]},
  {"id":"wsl-club-west-ham-united","title":"West Ham United Women: Club Spotlight","category":"clubs","level":"all","summary":"Meet West Ham United and turn watching WSL football into a mini coaching session.","body":["CLUB IDENTITY: West Ham United are known as The Hammers. West Ham entered the WSL in 2018. Their women's side represents east London and shares the club's famous claret-and-blue identity.","DID YOU KNOW? The Hammers nickname connects the women's team with the wider club's industrial heritage.","YOUR CLUB DETECTIVE MISSION: Look for a moment when several defenders recover together after losing the ball. Compare what you notice with the learning activity below.","THE CLUB: West Ham United represents east London in the 2026/27 Women's Super League. WSL matches are a chance to watch talented players solve real problems under pressure.","YOUR WATCHING MISSION: Explore staying compact and reacting together. This is a way to study the game, not a claim that the team uses only one style: tactics change from match to match.","LOOK AGAIN: Pick one passage of play and spot how the team reshapes after losing the ball. What happened before the movement? Did it give a teammate more time or space?","TRY IT YOURSELF: Set up three cones in a triangle with two partners. Pass, move to a fresh angle and call or signal when you're available. Add a gentle defender if everyone is comfortable.","KEEP IT REAL: Pro football moves quickly. Start at your own pace, learn the decision and build up from there. A smart pass or helpful run counts even if it doesn't end in a goal."],"takeaway":"YOUR CHALLENGE: Watch ten minutes of West Ham United and spot one useful off-ball action.","source":[{"label":"WSL Football — official competition","url":"https://www.wslfootball.com/"}]},
  {"id":"england-lionesses-team","title":"England Lionesses: More Than the Final Score","category":"international","level":"all","summary":"Explore England's senior women's team and the teamwork behind big moments.","body":["MEET THE TEAM: The Lionesses are England's senior women's national football team. They won Women's EURO 2022 and defended the title in 2025. Players join from different clubs, bringing different strengths.","LOOK BEYOND THE GOALS: In a big tournament, a covering defender, an organised goalkeeper or a substitute ready to contribute can be just as important as the player who scores.","WATCH THE CHANGEOVER: When England lose the ball, notice whether the nearest player presses or the team drops into shape. There isn't one right answer for every situation.","TRY IT: Play a small 3v3 game. Award a bonus point when the whole team reacts together after losing possession, whether by pressing or recovering into shape.","MAKE IT YOURS: Think of one helpful action you can give your team that doesn't rely on scoring."],"takeaway":"YOUR CHALLENGE: Pick one Lionesses move and name three different players who helped create it.","source":[{"label":"England Football — senior women's team","url":"https://www.englandfootball.com/england/womens-senior-team"}]},
  {"id":"england-young-lionesses-development","title":"Young Lionesses: From England U21 to U23","category":"international","level":"all","summary":"How England's development teams help young players prepare for senior football.","body":["WHAT'S IN A NAME? England previously had a women's Under-21 development group. The top women's development squad is now the Under-23s, often called the Young Lionesses. So if you search for England U21, you may find older articles.","WHY IT MATTERS: Players don't jump from youth football to senior internationals overnight. Development teams give them a place to learn, compete and experience different styles of football.","WHAT TO WATCH: Players arrive from different clubs and have to build understanding quickly. Notice how they offer support, communicate and react when teammates do something unexpected.","TRY IT: Play a short possession game with friends you don't usually team up with. Agree two clear calls or signals, then see how much easier the passes become.","YOUR PATH IS YOURS: Most girls won't play international football, and that doesn't make their development any less worthwhile. Learning, friendships and enjoying the game all matter."],"takeaway":"YOUR CHALLENGE: Find a current Young Lionesses player and notice one skill she uses that you could practise.","source":[{"label":"England Football — women's U23 team","url":"https://www.englandfootball.com/england/youth/womens-u23"}]},
  {"id":"profile-ella-toone","title":"Ella Toone: Learn From Her Game","category":"players","level":"all","summary":"A player to know, a skill to spot and something you can try.","body":["MEET ELLA TOONE: Ella Toone is an England attacking midfielder associated with Manchester United. You don't need to copy her whole style to learn something useful from her football.","THE SKILL: Focus on finding pockets of space between midfield and defence. Great players don't only help when they're on the ball. Their movement, timing and choices matter too.","WATCH IT: Watch her movement before a pass: does she drift away from a marker, check her shoulder or arrive late near goal? Watch a short clip twice: once for the ball and once just for her movement.","GIVE IT A GO: In a square, receive from a partner, check over your shoulder and turn towards either of two cone gates. Begin slowly, then add a little pressure when you feel ready.","MAKE IT YOURS: Pick the part that suits your position. Every player develops differently, and the aim is to build your own game."],"takeaway":"YOUR CHALLENGE: Watch Ella Toone for five minutes and write down one decision you want to try at training.","source":[]},
  {"id":"profile-alessia-russo","title":"Alessia Russo: Learn From Her Game","category":"players","level":"all","summary":"A player to know, a skill to spot and something you can try.","body":["MEET ALESSIA RUSSO: Alessia Russo is an England centre-forward who plays for Arsenal. You don't need to copy her whole style to learn something useful from her football.","THE SKILL: Focus on linking with teammates as well as finishing. Great players don't only help when they're on the ball. Their movement, timing and choices matter too.","WATCH IT: Look at how she makes herself available for a pass and then moves towards goal. Watch a short clip twice: once for the ball and once just for her movement.","GIVE IT A GO: Practise receiving with your back to goal, setting a pass back to a teammate, then turning to attack a cone gate. Begin slowly, then add a little pressure when you feel ready.","MAKE IT YOURS: Pick the part that suits your position. Every player develops differently, and the aim is to build your own game."],"takeaway":"YOUR CHALLENGE: Watch Alessia Russo for five minutes and write down one decision you want to try at training.","source":[]},
  {"id":"profile-lauren-hemp","title":"Lauren Hemp: Learn From Her Game","category":"players","level":"all","summary":"A player to know, a skill to spot and something you can try.","body":["MEET LAUREN HEMP: Lauren Hemp is an England winger who plays for Manchester City. You don't need to copy her whole style to learn something useful from her football.","THE SKILL: Focus on changes of pace and taking on defenders. Great players don't only help when they're on the ball. Their movement, timing and choices matter too.","WATCH IT: Notice when she slows down before accelerating, and when she passes rather than dribbles. Watch a short clip twice: once for the ball and once just for her movement.","GIVE IT A GO: Start five metres from a cone, approach under control, then change direction and accelerate into space. Begin slowly, then add a little pressure when you feel ready.","MAKE IT YOURS: Pick the part that suits your position. Every player develops differently, and the aim is to build your own game."],"takeaway":"YOUR CHALLENGE: Watch Lauren Hemp for five minutes and write down one decision you want to try at training.","source":[]},
  {"id":"profile-laura-blindkilde-brown","title":"Laura Blindkilde Brown: Learn From Her Game","category":"players","level":"all","summary":"A player to know, a skill to spot and something you can try.","body":["MEET LAURA BLINDKILDE BROWN: Laura Blindkilde Brown is an England midfielder who plays for Manchester City. You don't need to copy her whole style to learn something useful from her football.","THE SKILL: Focus on supporting angles and midfield decisions. Great players don't only help when they're on the ball. Their movement, timing and choices matter too.","WATCH IT: Watch where she stands when a teammate is pressed. Can she offer a simple way out? Watch a short clip twice: once for the ball and once just for her movement.","GIVE IT A GO: Play three-player passing triangles, moving to a new angle after every pass. Begin slowly, then add a little pressure when you feel ready.","MAKE IT YOURS: Pick the part that suits your position. Every player develops differently, and the aim is to build your own game."],"takeaway":"YOUR CHALLENGE: Watch Laura Blindkilde Brown for five minutes and write down one decision you want to try at training.","source":[]},
  {"id":"profile-daphne-van-domselaar","title":"Daphne van Domselaar: Learn From Her Game","category":"players","level":"all","summary":"A player to know, a skill to spot and something you can try.","body":["MEET DAPHNE VAN DOMSELAAR: Daphne van Domselaar is a Netherlands goalkeeper who plays for Arsenal. You don't need to copy her whole style to learn something useful from her football.","THE SKILL: Focus on starting positions and calm decisions. Great players don't only help when they're on the ball. Their movement, timing and choices matter too.","WATCH IT: Watch how she adjusts as the ball moves wide and how she sets herself before a shot. Watch a short clip twice: once for the ball and once just for her movement.","GIVE IT A GO: With a partner moving a ball side to side, shuffle into line and set your feet; begin without shots. Begin slowly, then add a little pressure when you feel ready.","MAKE IT YOURS: Pick the part that suits your position. Every player develops differently, and the aim is to build your own game."],"takeaway":"YOUR CHALLENGE: Watch Daphne van Domselaar for five minutes and write down one decision you want to try at training.","source":[]},
  {"id":"profile-hannah-cain","title":"Hannah Cain: Learn From Her Game","category":"players","level":"all","summary":"A player to know, a skill to spot and something you can try.","body":["MEET HANNAH CAIN: Hannah Cain is a Wales international forward. You don't need to copy her whole style to learn something useful from her football.","THE SKILL: Focus on movement to create shooting chances. Great players don't only help when they're on the ball. Their movement, timing and choices matter too.","WATCH IT: Watch her runs away from the ball as well as what she does when she receives it. Watch a short clip twice: once for the ball and once just for her movement.","GIVE IT A GO: Use two cone gates: fake a move towards one, change direction and receive through the other. Begin slowly, then add a little pressure when you feel ready.","MAKE IT YOURS: Pick the part that suits your position. Every player develops differently, and the aim is to build your own game."],"takeaway":"YOUR CHALLENGE: Watch Hannah Cain for five minutes and write down one decision you want to try at training.","source":[]},
  {"id":"profile-esme-morgan","title":"Esme Morgan: Learn From Her Game","category":"players","level":"all","summary":"A player to know, a skill to spot and something you can try.","body":["MEET ESME MORGAN: Esme Morgan is an England defender who has played for Manchester City and Washington Spirit. You don't need to copy her whole style to learn something useful from her football.","THE SKILL: Focus on reading danger and covering teammates. Great players don't only help when they're on the ball. Their movement, timing and choices matter too.","WATCH IT: Watch how she positions herself when another defender steps towards the ball. Watch a short clip twice: once for the ball and once just for her movement.","GIVE IT A GO: In a 2v2, one defender pressures the ball while the other protects the space behind. Begin slowly, then add a little pressure when you feel ready.","MAKE IT YOURS: Pick the part that suits your position. Every player develops differently, and the aim is to build your own game."],"takeaway":"YOUR CHALLENGE: Watch Esme Morgan for five minutes and write down one decision you want to try at training.","source":[]},
  {"id":"profile-ellie-mason","title":"Ellie Mason: Learn From Her Game","category":"players","level":"all","summary":"A player to know, a skill to spot and something you can try.","body":["MEET ELLIE MASON: Ellie Mason is a Northern Ireland international defender. You don't need to copy her whole style to learn something useful from her football.","THE SKILL: Focus on timing tackles and supporting teammates. Great players don't only help when they're on the ball. Their movement, timing and choices matter too.","WATCH IT: Look for moments when staying on her feet is more useful than diving into a tackle. Watch a short clip twice: once for the ball and once just for her movement.","GIVE IT A GO: Play a narrow 1v1 channel; the defender earns a point for delaying the attacker for five seconds. Begin slowly, then add a little pressure when you feel ready.","MAKE IT YOURS: Pick the part that suits your position. Every player develops differently, and the aim is to build your own game."],"takeaway":"YOUR CHALLENGE: Watch Ellie Mason for five minutes and write down one decision you want to try at training.","source":[]},
  {"id":"profile-ella-powell","title":"Ella Powell: Learn From Her Game","category":"players","level":"all","summary":"A player to know, a skill to spot and something you can try.","body":["MEET ELLA POWELL: Ella Powell is a Wales international defender. You don't need to copy her whole style to learn something useful from her football.","THE SKILL: Focus on balancing wide defending with supporting attacks. Great players don't only help when they're on the ball. Their movement, timing and choices matter too.","WATCH IT: Notice when she moves forward and when she stays to protect space behind a teammate. Watch a short clip twice: once for the ball and once just for her movement.","GIVE IT A GO: In a 2v2 channel, practise deciding whether to overlap or offer a safer pass behind the ball. Begin slowly, then add a little pressure when you feel ready.","MAKE IT YOURS: Pick the part that suits your position. Every player develops differently, and the aim is to build your own game."],"takeaway":"YOUR CHALLENGE: Watch Ella Powell for five minutes and write down one decision you want to try at training.","source":[]},
  {
    "id": "player-guide-find-space-early",
    "title": "Find Space Before You Need It",
    "category": "positions",
    "level": "all",
    "summary": "You don't have to wait for the ball to make a difference.",
    "body": [
      "Imagine your teammate has the ball and two opponents are close to her. Instead of standing still and calling louder, take two steps into a passing lane where she can actually see you.",
      "Try looking over both shoulders as you move. Where is the defender? Can you receive facing forward, or would a safer supporting angle help? Space changes every second, so keep adjusting rather than finding one spot and staying there.",
      "If a defender follows you, you may have created space for another teammate. That counts as useful movement even if you never touch the ball.",
      "THINGS TO TRY: In a three-player passing triangle, move to a new angle after every pass. Add a passive defender and see how the passing lane changes."
    ],
    "takeaway": "YOUR CHALLENGE: During your next game, notice one moment when your movement helped someone else get the ball.",
    "source": []
  },
  {
    "id": "player-guide-first-five-metres",
    "title": "The Secret of a Good First Five Metres",
    "category": "positions",
    "level": "all",
    "summary": "Quick movement starts with noticing the moment, not just sprinting.",
    "body": [
      "Your first few steps can help you beat an opponent to a loose ball, recover into defence or make a run behind. But sprinting everywhere is exhausting and often takes you out of position.",
      "Watch for clues: a teammate lifting her head to pass, an opponent taking a heavy touch, or space opening as a defender turns. Prepare your body so you can accelerate in the useful direction.",
      "Think about your first step. If you're balanced and already facing the right way, you may not need to be the fastest player on the pitch to arrive first.",
      "THINGS TO TRY: Put two cones five metres apart. Have a partner point left or right and accelerate only after the signal. Rest fully between attempts."
    ],
    "takeaway": "YOUR CHALLENGE: Identify one moment when reacting early mattered more than running fast.",
    "source": []
  },
  {
    "id": "player-guide-shield-ball-calmly",
    "title": "How to Shield the Ball Without Panicking",
    "category": "positions",
    "level": "all",
    "summary": "You can protect possession even when a defender is right behind you.",
    "body": [
      "Shielding isn't about pushing someone away. It's about placing your body between the defender and the ball, keeping a balanced stance and knowing where your next pass could go.",
      "Use your arm for balance and awareness without holding or shoving. Keep the ball on the side farther from pressure, then look for a teammate or a turn into space.",
      "If you feel trapped, a simple backward pass can be a smart choice. Keeping the ball for your team is better than forcing a risky turn just to look impressive.",
      "THINGS TO TRY: In a small square, receive with a passive defender behind you. Hold possession for three seconds, then pass through a side gate. Swap roles."
    ],
    "takeaway": "YOUR CHALLENGE: Use your body position to give yourself one extra second on the ball.",
    "source": []
  },
  {
    "id": "player-guide-fullback-two-jobs",
    "title": "The Full-Back's Two Jobs",
    "category": "positions",
    "level": "all",
    "summary": "A full-back can defend brilliantly and still help the attack.",
    "body": [
      "When your team doesn't have the ball, watch the winger, the space inside you and your nearest centre-back. If you chase too wide without cover, an opponent may run through the gap.",
      "When your team wins possession, look for a safe passing angle. Sometimes an overlapping run outside your winger is useful; other times staying behind her gives the team protection if possession is lost.",
      "You don't have to overlap on every attack. Read where the ball is, whether your teammate can find you and whether someone can cover the space you leave.",
      "THINGS TO TRY: In a 2v2 channel, take turns as the defending full-back and attacking support player. After each round, say where the space opened."
    ],
    "takeaway": "YOUR CHALLENGE: Make one clear decision to stay and support rather than running forward automatically.",
    "source": []
  },
  {
    "id": "player-guide-striker-movement",
    "title": "Striker Movement: Make a Defender Choose",
    "category": "positions",
    "level": "all",
    "summary": "A clever run can create a chance before you touch the ball.",
    "body": [
      "Standing between two defenders and waiting for a perfect pass makes their job easy. A short movement towards the ball can invite one defender to follow; a change of direction can then open space behind.",
      "Watch the player who might pass to you. If she is under pressure and looking down, your sprint may be too early. If she has time and looks up, prepare to attack the space.",
      "Not every run ends in a pass. Your movement may drag a defender away and open a lane for a teammate, which is another way to help the attack.",
      "THINGS TO TRY: Mark two gates with cones. Start in the middle, move towards one, then change direction towards the other as your partner looks up."
    ],
    "takeaway": "YOUR CHALLENGE: Make one run that gives your teammate a clear choice, even if the pass doesn't come.",
    "source": []
  },
  {
    "id": "player-guide-midfield-escape",
    "title": "The Midfielder's Escape Route",
    "category": "positions",
    "level": "all",
    "summary": "Being surrounded doesn't mean you have no options.",
    "body": [
      "Central midfield can feel crowded because pressure arrives from different directions. Before receiving, check who is behind you, where your supporting players are and which foot would make your first touch easier.",
      "You don't always need to turn. A first-time return pass can move an opponent, creating a better angle for the next pass. A sideways touch may be enough to escape pressure.",
      "The smartest choice is often the one you spotted before the ball arrived. That is why scanning matters more than attempting a fancy turn every time.",
      "THINGS TO TRY: Make a square with four cones. Receive from one side while a partner calls a different exit gate. Check before the pass and play through the chosen gate."
    ],
    "takeaway": "YOUR CHALLENGE: Find one moment to play a simple pass that helps your team escape pressure.",
    "source": []
  },
  {
    "id": "player-guide-defend-tricky-dribbler",
    "title": "How to Defend a Player Who Loves Tricks",
    "category": "tactics",
    "level": "all",
    "summary": "You don't have to win every duel with a dramatic tackle.",
    "body": [
      "A skilful dribbler wants you to dive in or turn your body too early. Stay balanced, slow down as you approach and keep enough distance to react to a change of direction.",
      "Try to guide the attacker away from dangerous central space when your team's plan allows it. Watch the ball and the attacker's touch rather than copying every shoulder feint.",
      "If the attacker passes backwards because you stayed patient, that can be a defensive success. You have helped your team without needing a tackle.",
      "THINGS TO TRY: Play 1v1 in a narrow channel. The defender scores a point by delaying the attacker for five seconds, not just by winning the ball."
    ],
    "takeaway": "YOUR CHALLENGE: Celebrate one time you slowed an attack down without tackling.",
    "source": []
  },
  {
    "id": "player-guide-three-seconds-transition",
    "title": "What to Do in the Three Seconds After Losing the Ball",
    "category": "tactics",
    "level": "all",
    "summary": "The next few seconds can change the whole move.",
    "body": [
      "When possession changes, it's tempting to stop and feel annoyed about the pass that went wrong. Instead, check where the ball is, which opponent is nearest and whether you can help defend safely.",
      "Sometimes pressing immediately is useful. Other times you need to recover towards your team and protect space. Chasing the ball alone can leave a bigger gap behind you.",
      "Use a quick cue such as 'react' to shift your attention from the mistake to the next decision. Your teammates will benefit from your movement more than from an apology shouted across the pitch.",
      "THINGS TO TRY: In a 3v3 game, award an extra point when a team regains shape quickly after losing possession. Discuss what helped."
    ],
    "takeaway": "YOUR CHALLENGE: After your next lost ball, make one useful defensive movement straight away.",
    "source": []
  },
  {
    "id": "player-guide-switch-play",
    "title": "When to Switch Play",
    "category": "tactics",
    "level": "all",
    "summary": "The crowded side isn't always the best side.",
    "body": [
      "If several opponents have moved towards the ball, there may be space on the other side of the pitch. Switching play means moving the ball to that space, sometimes through a supporting teammate rather than one huge pass.",
      "Before switching, check that the receiving player has room and a safe angle. A long pass that hangs in the air can give defenders time to recover.",
      "Moving the ball backwards for one pass can be the start of a better forward attack. Football isn't a race to pass towards goal every second.",
      "THINGS TO TRY: Create two wide gates and a central helper. Pass into one side, then use the helper to move the ball to the opposite gate."
    ],
    "takeaway": "YOUR CHALLENGE: Spot one moment when a teammate on the far side has more space.",
    "source": []
  },
  {
    "id": "player-guide-counterattack-decisions",
    "title": "How to Recognise a Counterattack",
    "category": "tactics",
    "level": "all",
    "summary": "Winning the ball is only the start of the decision.",
    "body": [
      "A counterattack happens when your team moves forward quickly after regaining possession, often before opponents have reorganised. Look up: is there open space, a runner and a safe pass?",
      "Speed doesn't mean rushing blindly. If the opposition is already organised, keeping possession may be the smarter choice. A useful first touch and a clear pass can be faster than dribbling into traffic.",
      "If you're away from the ball, support at a different angle rather than following the same running line as your teammate.",
      "THINGS TO TRY: Play 3v2 towards two small goals. Start when the three attackers receive a loose ball, then discuss whether to pass, carry or slow down."
    ],
    "takeaway": "YOUR CHALLENGE: After a turnover, look forward once before deciding whether to keep the ball.",
    "source": []
  },
  {
    "id": "player-guide-corner-movement",
    "title": "Corners: Make Your Movement Matter",
    "category": "tactics",
    "level": "all",
    "summary": "You can influence a corner without being the tallest player.",
    "body": [
      "A corner creates a busy area where defenders watch both the ball and the runners. Timing matters: arriving in a space as the ball is delivered can be more useful than standing there early.",
      "Your role might be attacking the near area, waiting for a loose ball, offering a short pass or staying back to protect against a counterattack. Every role has a purpose.",
      "Talk through the plan with your coach so players don't all run towards the same spot. Respect the rules and avoid pushing or blocking opponents illegally.",
      "THINGS TO TRY: Walk through three corner roles without defenders, then add a passive defender. Focus on starting positions and timing."
    ],
    "takeaway": "YOUR CHALLENGE: Ask your coach what your job is when your team has a corner.",
    "source": []
  },
  {
    "id": "player-guide-high-defensive-line",
    "title": "How to Play Against a High Defensive Line",
    "category": "tactics",
    "level": "all",
    "summary": "Space behind defenders is useful only if your timing is right.",
    "body": [
      "A high defensive line leaves space towards the goal behind it, but attackers must pay attention to offside and the moment the pass is played.",
      "Start by checking the defender's position and the teammate with the ball. A curved or delayed run may help you stay onside while moving into space.",
      "If the pass isn't available, don't keep sprinting away. Reposition to support and be ready for the next chance. The best movement gives your teammate options.",
      "THINGS TO TRY: With a coach, use cones as a defensive line and practise timing runs as a passer looks up. Add a moving defender once the idea is clear."
    ],
    "takeaway": "YOUR CHALLENGE: Watch one professional match and notice when an attacker delays a run to stay onside.",
    "source": []
  },
  {
    "id": "player-guide-wet-weather-football",
    "title": "Playing in the Rain: Smart Adjustments",
    "category": "tactics",
    "level": "all",
    "summary": "Wet football can be messy, but it can also teach you loads.",
    "body": [
      "On a wet pitch, the ball may skid faster or slow in patches. Your first touch, passing weight and turning speed might need adjusting. Don't assume the ball will behave the same way all match.",
      "Keep your movements controlled and choose footwear suitable for the actual surface. If conditions are unsafe, coaches and officials should decide whether play can continue.",
      "Communication becomes especially useful when a teammate is about to receive a slippery pass or when a goalkeeper may struggle with a bouncing ball.",
      "THINGS TO TRY: In safe conditions, compare a gentle pass on a dry area and a damp area. Notice the difference and adjust the next pass."
    ],
    "takeaway": "YOUR CHALLENGE: Make one thoughtful change to your first touch or passing weight when conditions change.",
    "source": []
  },
  {
    "id": "player-guide-small-practice-habits",
    "title": "Build a Practice Habit That Actually Sticks",
    "category": "tactics",
    "level": "all",
    "summary": "Ten useful minutes can beat a huge plan you never do.",
    "body": [
      "A practice habit works better when it fits your life. Choose one skill you genuinely want to improve and a time when you have space, energy and permission to practise.",
      "Keep the activity simple. Five minutes of passing against a safe wall or controlled touches in a small space can be enough to focus on one detail. Rest when you need to.",
      "Track what you tried, not just how many perfect repetitions you managed. Some weeks will be busy with school, friends and family; that doesn't mean you've failed.",
      "THINGS TO TRY: Pick a skill, choose two short practice slots this week and write down one thing you noticed after each."
    ],
    "takeaway": "YOUR CHALLENGE: Make a plan small enough that you would still want to do it on a busy week.",
    "source": []
  },
  {
    "id": "player-guide-ask-for-ball",
    "title": "The Art of Asking for the Ball",
    "category": "tactics",
    "level": "all",
    "summary": "Calling for a pass is about helping, not shouting the loudest.",
    "body": [
      "A good call tells your teammate something useful. You might say her name, point to the space you want or offer a clear angle so she knows where the pass can go.",
      "Timing matters. If your teammate is under pressure, shouting for a difficult pass may make her job harder. Sometimes moving closer for a simple option is better.",
      "You can communicate in different ways. A gesture, eye contact or agreed signal can work just as well as a loud voice.",
      "THINGS TO TRY: In a passing game, communicate once before receiving using a word or signal. Discuss which messages helped the passer."
    ],
    "takeaway": "YOUR CHALLENGE: Give one teammate a genuinely helpful passing option and signal.",
    "source": []
  },
  {
    "id": "player-guide-substitute-match-learning",
    "title": "What to Do When You're on the Bench",
    "category": "tactics",
    "level": "all",
    "summary": "You can learn from a match before you step onto the pitch.",
    "body": [
      "Being a substitute can be disappointing, especially when you want to help. You're allowed to feel frustrated. While you wait, watch what your position needs: where is the space, who is tiring and what does the team need?",
      "Stay prepared according to your coach's instructions. When you're called on, focus on your first useful action rather than trying to prove everything in one touch.",
      "If playing time worries you regularly, ask your coach for a calm conversation about development and opportunities. You deserve respectful feedback.",
      "THINGS TO TRY: While watching, identify two moments when a player in your position makes a helpful off-ball movement."
    ],
    "takeaway": "YOUR CHALLENGE: Choose one simple action to focus on when you enter the game.",
    "source": []
  },
  {
    "id": "player-guide-use-coaching-feedback",
    "title": "Make Feedback Work for You",
    "category": "tactics",
    "level": "all",
    "summary": "Feedback is information, not a verdict on who you are.",
    "body": [
      "'Check your shoulder' is easier to use than 'be better'. If an instruction feels confusing, ask for an example or a demonstration. Coaches should help you understand what to try.",
      "Pick one piece of feedback rather than trying to change five things at once. You might focus on scanning before receiving for a whole session.",
      "After training, ask yourself whether you attempted the action. Improvement isn't always immediate, and one mistake doesn't erase the progress you made.",
      "THINGS TO TRY: Write one coaching instruction as an action you can see or feel. For example, 'look left and right before the pass arrives'."
    ],
    "takeaway": "YOUR CHALLENGE: Ask one question when feedback isn't clear.",
    "source": []
  },
  {
    "id": "player-guide-support-teammates",
    "title": "How to Be a Brilliant Teammate on a Hard Day",
    "category": "stories",
    "level": "all",
    "summary": "You don't need to score to make someone else's match better.",
    "body": [
      "Maybe a teammate has missed a chance, lost her place or arrived looking upset. You don't have to fix her feelings. A kind word, a clear passing option or simply including her in a drill can help.",
      "Avoid teasing someone about mistakes, even if other people are laughing. Good teams make room for players to learn without embarrassment.",
      "If a teammate tells you something serious or unsafe, tell a trusted adult or welfare officer. Supporting a friend doesn't mean carrying a safeguarding problem alone.",
      "THINGS TO TRY: During your next session, notice one player who hasn't been included much and invite her into a warm-up or passing activity."
    ],
    "takeaway": "YOUR CHALLENGE: Give specific encouragement about an action, not just 'good job'.",
    "source": []
  },
  {
    "id": "player-guide-your-football-style",
    "title": "Find Your Own Football Style",
    "category": "stories",
    "level": "all",
    "summary": "You don't have to copy another player to be valuable.",
    "body": [
      "Watching great players can give you ideas, but you don't need their height, speed or personality to learn from them. Notice one decision or movement you admire and think about how it might fit your game.",
      "Maybe you're calm under pressure, brave in challenges, clever at finding space or brilliant at encouraging others. These strengths can grow together over time.",
      "Your football style will change as you develop. Trying new roles and skills isn't losing your identity; it's discovering more options.",
      "THINGS TO TRY: Watch ten minutes of a match and choose one movement from a player in your position. Practise a safe, simplified version with a partner."
    ],
    "takeaway": "YOUR CHALLENGE: Write down one strength you enjoy using and one new skill you're curious about.",
    "source": []
  },
  {
    "id": "player-guide-match-nerves-toolkit",
    "title": "Your Match-Day Nerves Toolkit",
    "category": "stories",
    "level": "all",
    "summary": "Feeling nervous doesn't mean you're not ready.",
    "body": [
      "A match can feel important, and your body may react with butterflies, shaky legs or racing thoughts. Lots of players experience nerves. You don't have to pretend you're fearless.",
      "Choose a short routine you control: arrive with time, prepare your kit, take a comfortable breath and focus on one task such as offering for the first pass.",
      "Avoid setting a goal like 'I must score'. Instead choose something you can attempt whatever the result: communicate early, recover after losing the ball or try a positive first touch.",
      "THINGS TO TRY: Before your next session, choose a three-step routine and practise it even if you feel calm."
    ],
    "takeaway": "YOUR CHALLENGE: After the match, notice whether your routine helped you focus, not whether you felt zero nerves.",
    "source": []
  },
  {
    "id": "gk-goalkeeper-positioning-angles-football",
    "title": "Goalkeeper Positioning and Angles: How to Make More Saves",
    "category": "goalkeeping",
    "level": "all",
    "summary": "Learn goalkeeper positioning, angles and starting positions in football, with practical exercises for young goalkeepers.",
    "body": [
      "The best goalkeeper save is often made easier before the shot is taken. Positioning helps a goalkeeper cover the goal, react to danger and make decisions with confidence. Young keepers can improve this skill without diving repeatedly or relying on exceptional reflexes.",
      "Start with the ball and the goal: A goalkeeper should regularly check the ball's location in relation to the centre of the goal. As the ball moves sideways, the goalkeeper adjusts position so the likely shooting angle is covered. Standing exactly in the middle of the goal regardless of where the ball is can leave a large opening. Equally, moving too far towards the near post may expose the far side. Practise moving across the goal as a coach carries a ball from side to side. Pause at different angles and discuss what the keeper can see.",
      "Understand distance from the goal line: Coming forward can reduce the angle available to a shooter, but it also creates a risk if the ball is lifted over the goalkeeper or played behind. The right starting position depends on the distance of the attacker, pressure on the ball, other defenders and the keeper's ability to recover. Rather than teaching one fixed distance, ask the goalkeeper to adjust as the attack develops and explain why she moved.",
      "Set before the shot: Goalkeepers need a balanced position when the shot arrives. Moving continuously or crossing the feet at the wrong moment can make reacting difficult. Use controlled footwork to get into position, then prepare to respond. The precise timing depends on the shooter and the situation. A partner can move the ball to either side before taking a gentle shot, allowing the goalkeeper to practise adjusting and setting.",
      "Read the attacker: Watch the ball, the attacker's approach and available passing options. A shot is not inevitable simply because an opponent approaches the penalty area. If a defender is closing down the shooter, the goalkeeper may need to prepare for a deflection or a pass rather than committing early. Encourage scanning between the attacker and other runners without losing track of the ball.",
      "Train angles safely: Mark three shooting points outside the goal area and ask the goalkeeper to find a balanced position for each. Start with stationary balls and controlled shots. Add movement and decision-making gradually. Do not turn every repetition into a full-length dive, especially on unsuitable surfaces. Review the goalkeeper's starting position before discussing whether the shot was saved. A good position can be the real success.",
      "Common positioning mistakes: Standing too deep, drifting towards the ball without checking the far post and moving during the shot are useful habits to notice. Correct one issue at a time. Overloading a young player with instructions can slow decision-making. Use short video clips where appropriate and with consent, or recreate the situation with cones to make the angle visible."
    ],
    "takeaway": "In a supervised session, place a ball in three different shooting positions. Have the goalkeeper move into position, explain what part of the goal she is protecting and then face a controlled shot.",
    "source": []
  },
  {
    "id": "gk-goalkeeper-handling-catching-technique",
    "title": "Goalkeeper Handling and Catching: Techniques and Training Drills",
    "category": "goalkeeping",
    "level": "all",
    "summary": "Improve goalkeeper handling and catching with age-appropriate drills for low balls, chest-height catches and rebounds.",
    "body": [
      "Reliable handling gives goalkeepers and defenders confidence. Catching is not just about strong hands: the goalkeeper must judge the ball, move into line and decide whether catching, parrying or another safe action is appropriate. These skills should be introduced gradually and without fear of mistakes.",
      "Move behind the ball: A goalkeeper often catches more securely when her body is aligned with the ball's path. Small adjustment steps help avoid reaching awkwardly. Start with gentle throws directly towards the keeper, then vary the angle so she must move before receiving. Encourage players to watch the ball into their hands rather than looking ahead to the next pass too early.",
      "Catching around chest height: For manageable balls, prepare the hands and arms to receive the ball with control. The exact technique varies by height, speed and coaching approach. Begin with soft, predictable serves and check that the goalkeeper is comfortable before increasing pace. A good coach adapts hand positioning to the player and does not demand identical technique for every delivery.",
      "Handling low balls: Low balls require the goalkeeper to lower her centre of gravity, move into line and secure the ball without unnecessary strain. Practise gentle rolling balls first, then progress to controlled shots along the ground. The goalkeeper should learn when to gather and when movement or a safe block is more suitable. Avoid repeatedly forcing painful knee or hip positions. Adapt to the player's mobility and the playing surface.",
      "When not to catch: Not every shot is safely catchable. A fast, awkward or deflected ball may call for a controlled parry or another action to protect the goal. The aim is to direct danger away from opponents and dangerous central areas where possible, not simply touch the ball. Teach judgement alongside technique so a player does not feel she has failed whenever she chooses not to hold a difficult shot.",
      "Dealing with rebounds: After a save, the goalkeeper should locate the ball quickly and be ready for a second action. Defenders also have responsibilities in reacting to loose balls. In practice, begin with a gentle shot and a controlled second ball rather than chaotic repeated efforts. Praise recovery position and awareness even if the first action was imperfect.",
      "Build a progressive practice: Use a sequence of easy catches, movement into line, low collections and a simple decision between catching and parrying. Give rest between repetitions and vary the service. Endless identical shots can lead to tired, careless technique. Diving and landing require appropriate coaching and a suitable surface; do not introduce them as an unsupervised home drill."
    ],
    "takeaway": "With a coach or suitable partner, complete a short progression of gentle catches, side-step catches and rolling-ball collections. Keep the pace controlled and focus on moving into line.",
    "source": []
  },
  {
    "id": "gk-goalkeeper-distribution-playing-out-back",
    "title": "Goalkeeper Distribution: Passing, Throwing and Playing Out from the Back",
    "category": "goalkeeping",
    "level": "all",
    "summary": "A practical goalkeeper distribution guide covering passing, throwing, scanning, playing out from the back and decision-making under pressure.",
    "body": [
      "Modern goalkeepers are part of the team's build-up play. They may receive passes under pressure, find teammates with throws or choose when a longer ball is the safer option. Good distribution is not about forcing short passes at all costs; it is about helping the team keep or progress possession when possible.",
      "Scan before receiving: Before the ball arrives, check where teammates, opponents and open spaces are. A goalkeeper who already knows her options can make a calmer first touch. Coaches should create clear passing angles rather than leaving the goalkeeper isolated with no safe option. A useful cue is to look once while the pass is travelling and again as the situation changes.",
      "First touch away from pressure: The first touch should help the goalkeeper prepare the next action. That may mean moving the ball away from an approaching opponent or setting it for a pass. Practise receiving from different angles with both feet. Begin without pressure, then introduce a defender who closes down slowly. A heavy touch can create danger, but so can freezing and waiting too long. Build comfort through repeated realistic situations.",
      "Choose the right passing option: A short pass to a full-back, a central defender or a midfielder can help the team play through pressure. But passing into a marked teammate may simply transfer the problem. Ask the goalkeeper to consider the receiver's body position and nearby opponents, not just whether a teammate is technically available. Sometimes the sensible decision is to play into space or clear longer. Avoid treating every long kick as a failure.",
      "Throwing and rolling accurately: Throws and rolls can start counterattacks when a teammate is free. Accuracy and timing matter more than distance. Practise releasing to a moving target, with the receiver checking into space. Vary the angle and distance gradually. Ensure the teammate is ready and the route is clear before releasing.",
      "Communicate with defenders: Goalkeepers can help organise the build-up by telling teammates when to spread out, offer support or turn away from pressure. Communication should be short and useful. Defenders also need to recognise when the keeper is under pressure and provide an alternative. Agree simple team principles so players are not improvising conflicting instructions in dangerous areas.",
      "Create a realistic decision game: Set two passing gates and one longer target. A coach moves as a passive defender, and the goalkeeper chooses the safest useful option. Progress by allowing the defender to press more actively, provided the player is comfortable and the drill remains safe. Review the decision as well as the pass. A technically accurate ball into danger may still be the wrong choice."
    ],
    "takeaway": "Set up two short targets and one longer target. Receive a pass, scan, then select a target based on where a passive defender moves. Repeat with both feet.",
    "source": []
  },
  {
    "id": "gk-goalkeeper-one-on-one-situations",
    "title": "Goalkeeper One-on-Ones: Positioning, Timing and Decision-Making",
    "category": "goalkeeping",
    "level": "all",
    "summary": "Learn how goalkeepers can manage one-on-one situations using positioning, patience, communication and safe decision-making.",
    "body": [
      "A one-on-one can feel like the most exposed moment in football. An attacker is running towards goal and the goalkeeper has only seconds to choose what to do. Effective one-on-one goalkeeping is less about a dramatic charge and more about reading the attacker, managing space and committing at the right moment.",
      "Recognise the situation early: Notice whether the attacker has close control, whether a defender is recovering and how much space lies behind the defence. A heavy touch can create an opportunity to close down; a controlled attacker with time may require more patience. Keep checking the ball rather than assuming the attacker will shoot immediately.",
      "Control the distance: Moving forward can narrow the shooting angle, but coming too far too early may allow the attacker to go around or lift the ball. Adjust the starting position as the attacker approaches. The correct distance changes with the attacker's speed and control. Teach the goalkeeper to stay balanced and able to react, not simply to sprint forward every time.",
      "Stay patient and make the attacker decide: An attacker may be waiting for the goalkeeper to commit. Remaining composed can encourage a rushed touch or shot. The goalkeeper should be prepared to react to a shot while watching for a moment when the ball moves away from the attacker's feet. Avoid guessing based on a single trick or body feint. Read the ball and the available space.",
      "Decide whether to claim or block: If the ball is genuinely loose and safe to reach, a goalkeeper may be able to claim it. If not, a controlled blocking action may be more appropriate. Contact situations carry risk. Coaches must teach safe techniques and respect the laws of the game; players should not be encouraged to launch themselves dangerously at opponents. Practise the judgement first with passive attackers and without collisions.",
      "Use recovering defenders: A goalkeeper can communicate with defenders about covering the central route or tracking another attacker. The keeper should not assume she is alone if a teammate can recover. Equally, defenders should not rely on the goalkeeper to solve every breakaway. A clear early call can reduce confusion about who challenges the ball.",
      "Practise progressively: Begin with an attacker dribbling slowly from a set point and a goalkeeper adjusting position. Freeze the action to discuss available choices. Add a controlled finish, then vary the attacker's touch. Increase speed only when technique and confidence are ready. Judge the goalkeeper's decision rather than counting every goal conceded as a mistake."
    ],
    "takeaway": "With a qualified coach, practise slow one-on-one approaches with a passive attacker. Pause at different distances to discuss whether to hold, advance or react to a loose touch.",
    "source": []
  },
  {
    "id": "gk-goalkeeper-confidence-after-mistakes",
    "title": "Goalkeeper Confidence: Recovering from Mistakes and Handling Pressure",
    "category": "goalkeeping",
    "level": "all",
    "summary": "Help young goalkeepers build confidence, recover after mistakes and manage pressure with practical guidance for players, parents and coaches.",
    "body": [
      "Goalkeepers often feel that their mistakes are more visible than anyone else's. A missed catch or misplaced pass can lead directly to a goal, even when many earlier actions contributed to the situation. Building confidence means helping a young goalkeeper learn from those moments without allowing them to define her.",
      "Understand why the position feels different: An outfield player may lose possession several times without an immediate goal. A goalkeeper's error can be remembered for weeks, particularly if teammates or adults react strongly. This visibility can make young keepers cautious. Some stop coming for crosses or avoid passing short because they fear being blamed. The solution is not to tell a player to stop caring. It is to make learning and support part of the team culture.",
      "Separate the action from the person: Describe what happened without attaching a label. 'Your starting position was deep' is useful feedback; 'You're a bad goalkeeper' is not. After a goal, consider whether the keeper had realistic options and whether the defence could have helped. Not every conceded goal is a goalkeeper error. Avoid analysing a mistake in front of an upset player immediately after the final whistle.",
      "Create a short reset routine: A reset can be as simple as noticing frustration, taking a comfortable breath and choosing the next task: organising defenders, checking the ball or preparing for a restart. Practise the routine during training after ordinary handling or passing mistakes so it becomes familiar. A reset is not about suppressing emotion. It is a way to return attention to something controllable.",
      "Build bravery in manageable steps: Confidence often grows when challenges are achievable but slightly uncomfortable. A keeper who fears high balls can begin with gentle predictable deliveries before facing realistic pressure. Progress through success and feedback rather than forcing repeated frightening situations. Diving, collisions and aerial challenges require suitable coaching and safe conditions. Let the player help choose the next step. Ownership matters.",
      "How teammates can help: Defenders should respond to goals with useful organisation rather than blame. A simple message about the next marking responsibility can help the team move on. Celebrate good decisions such as a clear call, brave positioning or accurate distribution, not just spectacular saves. Goalkeepers also need to feel included in normal team conversation and encouragement.",
      "What parents should say after a hard match: Ask whether the player wants to discuss football. She may prefer a quiet journey, a snack or conversation about something unrelated. When she is ready, ask what she felt she did well and what she wants to practise. Resist replaying one mistake repeatedly. If anxiety or distress persists and affects daily life, seek appropriate support beyond football coaching."
    ],
    "takeaway": "Choose one short reset cue, such as 'next action'. Use it after a mistake in training, then focus on a specific task the goalkeeper can control.",
    "source": []
  },
  {
    id: 'goalkeeper-part-of-the-team',
    title: 'Goalkeeper: another passing option',
    category: 'positions',
    level: 'all',
    summary: 'Your team can use your feet as well as your saves.',
    body: [
      'When your team has the ball, a goalkeeper can help defenders by moving into a useful supporting position. That gives the player on the ball another route out of pressure.',
      'Look at the space, your teammates and the opposition before choosing a pass. If possession changes, adjust your position so you are ready to defend again.',
      'Ask your coach where they want you during the build-up. The right choice depends on what is happening around you.',
    ],
    takeaway: 'Notice one moment when your position gives a teammate a safer passing option.',
    source: [sources.goalkeeper],
  },
  {
    id: 'defenders-connected',
    title: 'Defenders: stay connected',
    category: 'positions',
    level: 'all',
    summary: 'Defending works best when teammates solve the problem together.',
    body: [
      'In a back four, defenders need to move together as the ball travels. Gaps become easier for opponents to use when one player moves and the others do not react.',
      'Keep checking the ball, nearby attackers and your teammates. Talk early so your line can adjust and protect the middle of the pitch.',
      'Your coach may use a different team shape. Ask how your job changes when the ball moves wide or your team wins it back.',
    ],
    takeaway: 'Choose one clear word or signal that helps your defensive teammates stay connected.',
    source: [sources.defenders],
  },
  {
    id: 'midfield-number-six',
    title: 'Midfield: connect and protect',
    category: 'positions',
    level: 'all',
    summary: 'Explore how a holding midfielder helps the team keep its structure.',
    body: [
      'A holding midfielder, often called a number six, links the defensive players with teammates further forward. They also help protect central spaces when the team does not have the ball.',
      'Before receiving, look for pressure and possible next passes. An open body position can help you play forward when the opportunity is there.',
      'Forward is not always the best option. Keeping the ball with a sensible supporting pass can help the team build another attack.',
    ],
    takeaway: 'Ask your coach which spaces you should protect when a teammate moves forward.',
    source: [sources.midfielder],
  },
  {
    id: 'forwards-move-to-receive',
    title: 'Forwards: the chance starts before the shot',
    category: 'positions',
    level: 'all',
    summary: 'Your movement and first touch can help create a shooting chance.',
    body: [
      'An attacking player can move into space around a defender to receive a pass. The timing matters: your run and your teammate’s pass need to work together.',
      'As the ball arrives, think about the next action. A well-directed first touch can create a clearer route towards goal.',
      'There is more to attacking than shooting quickly. Notice where the defender is and communicate with the teammate who can find your run.',
    ],
    takeaway: 'Look back on one attack and notice how the movement before receiving affected the chance.',
    source: [sources.forward],
  },
  {
    id: 'scanning-picture-first',
    title: 'See the picture before the pass',
    category: 'tactics',
    level: 'all',
    summary: 'A look around can give your next touch a purpose.',
    body: [
      'Scanning means checking what is around you. Look for opponents, teammates and useful space before the ball arrives, then keep updating that picture as play changes.',
      'The aim is to collect information you can use. If you have space, you may be able to turn. If pressure is close, a supporting pass may be a better choice.',
      'Ask your coach what to look for in your position. You do not need to make every decision perfectly to keep learning.',
    ],
    takeaway: 'Try naming one useful thing you spotted before receiving during your next session.',
    source: [sources.scanning],
  },
  {
    id: 'support-make-an-angle',
    title: 'Pass, move, help again',
    category: 'tactics',
    level: 'all',
    summary: 'You can influence the game when a teammate has the ball.',
    body: [
      'After passing, look for a new space where you can help again. Standing behind an opponent can make it difficult for your teammate to find you.',
      'An angle to the side, behind or beyond the ball can create another option. Several players offering different angles can give the team more than one way forward.',
      'If an area gets crowded, the team may need to move the ball elsewhere. Follow your coach’s guidance about the shape you are using.',
    ],
    takeaway: 'After your next pass, look for one new angle that helps the next player.',
    source: [sources.support],
  },
  {
    id: 'pressing-cover-together',
    title: 'Pressing: one moves, others support',
    category: 'tactics',
    level: 'senior',
    summary: 'An effective press needs shared timing and protection behind the first player.',
    body: [
      'Pressing is coordinated pressure on the opposition. The player going towards the ball needs teammates to help close the passing routes around them.',
      'If the first player is passed, a supporting teammate may become the next presser. The players’ jobs change as the ball moves.',
      'Chasing alone can leave spaces for opponents to use. Ask your coach which moments should start your press and where you should provide cover when someone else goes.',
    ],
    takeaway: 'Watch one pressing moment and identify the first presser and the teammate covering behind.',
    source: [sources.pressing],
  },
  {
    id: 'mary-earps-your-role-matters',
    title: 'Mary Earps: your role matters',
    category: 'stories',
    level: 'all',
    summary: 'A goalkeeper’s contribution can shape a team’s biggest moments.',
    body: [
      'Mary Earps helped England reach the 2023 Women’s World Cup final and received the tournament’s Golden Glove award for the best goalkeeper. She played in all seven of England’s matches.',
      'Her achievement is a reminder that football has many kinds of important moments. A goalkeeper’s work can be recognised alongside goals scored at the other end.',
      'For your own reflection, choose a part of your role that you are proud of. It does not have to appear on a scoresheet.',
    ],
    takeaway: 'Write down one contribution you made that helped your team, whatever your position.',
    source: [sources.earps],
  },
  {
    id: 'leah-williamson-lead-your-way',
    title: 'Leah Williamson: lead in your own way',
    category: 'stories',
    level: 'all',
    summary: 'Leadership can start with the way you support the people around you.',
    body: [
      'Leah Williamson represented England through its youth age groups before reaching the senior team. She captained England during their successful UEFA Women’s EURO 2022 campaign.',
      'England Football highlights her composure, passing ability and understanding of the game. Her story offers a way to think about leadership beyond scoring the most goals.',
      'You do not need an armband to practise being a helpful teammate. You could encourage someone, listen carefully or give a clear piece of information during play.',
    ],
    takeaway: 'Choose one small way to support a teammate at your next session.',
    source: [sources.williamson],
  },
  {
    id: 'bunny-shaw-create-and-finish',
    title: 'Bunny Shaw: create and finish',
    category: 'stories',
    level: 'all',
    summary: 'A forward can make a difference by helping others score too.',
    body: [
      'In July 2022, Khadija “Bunny” Shaw captained Jamaica in a 4–0 win over Haiti that secured qualification for the 2023 Women’s World Cup. She scored twice and also supplied an assist.',
      'That performance included both finishing and creating. It is a useful example to remember when you are deciding whether to shoot or help a teammate with a pass.',
      'For your own match reflection, notice a chance you helped create as well as any shots you took.',
    ],
    takeaway: 'Celebrate an attacking moment when your decision helped another player.',
    source: [sources.shaw],
  },
];

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'keeper-support',
    prompt: 'Your defender has the ball under pressure. How can a goalkeeper help?',
    options: ['Offer a useful passing option', 'Ignore the build-up', 'Run beside the nearest opponent', 'Always demand a long kick'],
    answer: 0,
    explanation: 'A supporting position can give your defender another pass. Look at the situation before choosing how to play.',
    level: 'all',
    source: sources.goalkeeper,
  },
  {
    id: 'defensive-connection',
    prompt: 'In a back four, what helps when play moves towards one side?',
    options: ['Everyone chases the ball separately', 'The defenders adjust together and communicate', 'Only the goalkeeper reacts', 'The line stops checking attackers'],
    answer: 1,
    explanation: 'Connected movement and communication help the defensive line avoid leaving useful gaps for opponents.',
    level: 'all',
    source: sources.defenders,
  },
  {
    id: 'forward-first-touch',
    prompt: 'What can help a forward turn a good pass into a clearer shooting chance?',
    options: ['Waiting behind the defender', 'Looking only at the ground', 'Timing the run and directing the first touch', 'Always taking as many touches as possible'],
    answer: 2,
    explanation: 'The run, pass and first touch work together. A purposeful touch can take the ball into a useful shooting space.',
    level: 'all',
    source: sources.forward,
  },
  {
    id: 'six-protect-and-connect',
    prompt: 'Which pair of jobs commonly belongs to a holding midfielder?',
    options: ['Stay highest and time runs behind the defence', 'Provide width and overlap on the outside', 'Hold the touchline and attack the outside channel', 'Connect build-up play and protect central spaces'],
    answer: 3,
    explanation: 'A number six often links the defensive players with those ahead while helping protect the centre when possession changes.',
    level: 'senior',
    source: sources.midfielder,
  },
  {
    id: 'scan-information',
    prompt: 'What is the main purpose of looking around before receiving a pass?',
    options: ['Collect information about pressure, teammates and space', 'Make every pass look more difficult', 'Avoid watching the ball at all', 'Guarantee that you can always turn'],
    answer: 0,
    explanation: 'Scanning gives you information for the next decision. It helps you choose an action; it does not guarantee one answer every time.',
    level: 'all',
    source: sources.scanning,
  },
  {
    id: 'after-the-pass',
    prompt: 'After passing to a teammate, what is a useful next thought?',
    options: ['My part in the move is over', 'Where can I move to offer another angle?', 'I must stand directly behind an opponent', 'I must always run straight at the ball'],
    answer: 1,
    explanation: 'Moving into another supporting position can give the next player an option and help the team keep progressing.',
    level: 'all',
    source: sources.support,
  },
  {
    id: 'press-and-cover',
    prompt: 'A teammate starts the press. What should supporting players consider?',
    options: ['Leaving every passing route open', 'All following exactly the same run', 'Closing nearby passing routes and providing cover', 'Waiting until the opposition shoots'],
    answer: 2,
    explanation: 'A press needs more than the first player. Covering teammates help reduce the opposition’s options and can take over if the ball moves past.',
    level: 'senior',
    source: sources.pressing,
  },
  {
    id: 'earps-2023-award',
    prompt: 'Which award did Mary Earps receive at the 2023 Women’s World Cup?',
    options: ['The Golden Boot for most goals', 'The Young Player Award', 'The Golden Ball for best player', 'The Golden Glove for best goalkeeper'],
    answer: 3,
    explanation: 'Earps received the Golden Glove as England reached the final. Different positions make different contributions to a team.',
    level: 'all',
    source: sources.earps,
  },
  {
    id: 'williamson-euro-captain',
    prompt: 'Who captained England during their UEFA Women’s EURO 2022 title-winning campaign?',
    options: ['Leah Williamson', 'Mary Earps', 'Khadija Shaw', 'Lucy Bronze'],
    answer: 0,
    explanation: 'Leah Williamson captained the team. Her development included representing England through its youth age groups.',
    level: 'all',
    source: sources.williamson,
  },
  {
    id: 'shaw-helps-jamaica',
    prompt: 'Alongside scoring twice against Haiti in July 2022, how did Bunny Shaw help Jamaica?',
    options: ['She saved a penalty', 'She also provided an assist', 'She scored all four of Jamaica’s goals', 'She played as their goalkeeper'],
    answer: 1,
    explanation: 'Shaw also created a goal for a teammate in the 4–0 win that secured Jamaica’s place at the 2023 World Cup.',
    level: 'all',
    source: sources.shaw,
  },
];
