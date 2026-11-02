export type LearningArticle = {
  id: string;
  title: string;
  category: 'positions' | 'tactics' | 'stories' | 'goalkeeping';
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
