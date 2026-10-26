export type LearningArticle = {
  id: string;
  title: string;
  category: 'positions' | 'tactics' | 'stories';
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
