import type { LearningProgress, PortalFeatureActions } from './playerPortalFeatures';
import { extraFootballActivities } from './playerActivitiesMore';

export type PitchPoint = { x: number; y: number };
export type ActivityChoice = {
  id: 'A' | 'B' | 'C'; label: string; at: PitchPoint;
  kind: 'pass' | 'loft' | 'move' | 'carry' | 'shoot' | 'hold' | 'touch';
  outcome: 'opens-play' | 'another-option' | 'look-again';
  feedback: string; detail: string;
};
export type ActivityScenario = {
  id: string; title: string; prompt: string; picture: string;
  hint: string; seniorHint: string; you: PitchPoint; ball: PitchPoint;
  teammates: PitchPoint[]; opponents: PitchPoint[]; choices: ActivityChoice[];
};
export type FootballActivity = {
  id: 'pass' | 'space' | 'next' | 'touch' | 'defend' | 'counter' | 'keeper-position' | 'keeper-distribution'; title: string;
  mode: 'ball' | 'player' | 'receive'; phase?: 'attack' | 'defend';
  role?: 'goalkeeper'; view?: 'goal-area'; source?: { label: string; url: string };
  description: string; focus: string; instruction: string;
  scenarios: ActivityScenario[];
};
const p = (x: number, y: number): PitchPoint => ({ x, y });
const choice = (id: ActivityChoice['id'], label: string, x: number, y: number,
  kind: ActivityChoice['kind'], outcome: ActivityChoice['outcome'], feedback: string, detail: string): ActivityChoice =>
  ({ id, label, at: p(x, y), kind, outcome, feedback, detail });

// Original STAR decision snapshots, not match simulations or official assessments.
// Coordinates share a 100 × 72 diagram. Our team attacks right and defends left.
export const footballActivities: FootballActivity[] = [
  {
    id: 'pass', mode: 'ball', title: 'Spot the Pass', focus: 'Look up. Find a passing lane.',
    description: 'Pick a teammate and discover what your pass could open up.',
    instruction: 'You have the ball. Tap A, B or C to choose a teammate.',
    scenarios: [
      {
        id: 'pass-wide', title: 'Look beyond the crowd',
        prompt: 'The middle is crowded. Who could receive with room to play?',
        picture: 'You are left of centre. A is ahead and high on the pitch; B is straight ahead behind a defender; C is behind you and low on the pitch.',
        hint: 'Imagine a line from the ball to each teammate. Is an opponent in the way?',
        seniorHint: 'Compare the passing lane and the pressure the receiver will face after the pass.',
        you: p(28, 36), ball: p(28, 36), teammates: [p(58, 14), p(66, 36), p(22, 59)], opponents: [p(45, 36), p(66, 49), p(80, 22)],
        choices: [
          choice('A', 'Pass wide to A', 58, 14, 'pass', 'opens-play', 'A has a clear passing lane and space to receive. Looking wide gives your team another way forward.', 'An angled pass moves the ball away from the central defender. A should still scan as the ball travels.'),
          choice('B', 'Pass straight to B', 66, 36, 'pass', 'look-again', 'An opponent is between you and B. Look for another lane before trying to pass through the middle.', 'B may look free, but the defender can step into the passing line. A change of angle could make B available later.'),
          choice('C', 'Keep it with C', 22, 59, 'pass', 'another-option', 'C offers a clear pass behind you. Keeping the ball can give your team time to find a new route.', 'A backwards pass can help retain possession. Look again afterwards rather than assuming the next pass must go forward.'),
        ],
      },
      {
        id: 'pass-switch', title: 'Find the other side',
        prompt: 'Opponents have gathered near your side. Where could you start a switch?',
        picture: 'You have the ball high on the left. A is farther along the same side with an opponent in the lane. B is behind and across the pitch. C is ahead in the middle, close to another defender.',
        hint: 'A pass away from the crowd can start a move to the other side.',
        seniorHint: 'A switch can use more than one pass. Compare the risk of a long inside pass with a supporting pass first.',
        you: p(30, 17), ball: p(30, 17), teammates: [p(61, 16), p(22, 53), p(63, 41)], opponents: [p(45, 17), p(51, 32), p(77, 55)],
        choices: [
          choice('A', 'Pass along the side to A', 61, 16, 'pass', 'look-again', 'The defender is in this passing lane. Passing along the same side keeps the ball near the crowd.', 'A teammate being ahead does not make the pass available. The defender could intercept before A receives.'),
          choice('B', 'Start the switch with B', 22, 53, 'pass', 'opens-play', 'B is away from the crowd with a clear lane. This can help your team move the ball to a less crowded side.', 'Using support behind the ball changes the angle of attack without forcing a long pass through pressure.'),
          choice('C', 'Try the inside pass to C', 63, 41, 'pass', 'look-again', 'C is close to a defender, and the passing lane is tight. Check whether C can move or whether B offers more room.', 'This pass asks both passer and receiver to work in a narrow space. A new receiving angle would reduce the risk.'),
        ],
      },
      {
        id: 'pass-gap', title: 'Between two opponents',
        prompt: 'There is a gap between two opponents. Which teammate could use it?',
        picture: 'You are left of centre. A is straight ahead beyond a gap between two defenders. B is high on the pitch beside one defender. C offers support behind you.',
        hint: 'Look between the defenders, as well as around them.',
        seniorHint: 'Check whether a forward receiver is beyond the defenders and whether the lane is still open.',
        you: p(28, 38), ball: p(28, 38), teammates: [p(72, 37), p(51, 12), p(24, 61)], opponents: [p(50, 23), p(50, 51), p(86, 53)],
        choices: [
          choice('A', 'Pass through the gap to A', 72, 37, 'pass', 'opens-play', 'The gap gives you a route to A. A forward pass can help when the lane is clear.', 'The pass can break a defensive line. Its weight matters: A needs time to control before the next opponent arrives.'),
          choice('B', 'Pass towards B', 51, 12, 'pass', 'look-again', 'B is close to an opponent. Look at the receiver’s space, not only the space the ball travels through.', 'The defender can press B as the pass arrives. A movement away from the marker could change the decision.'),
          choice('C', 'Use C behind you', 24, 61, 'pass', 'another-option', 'C is a safe supporting option. You can keep the ball if the forward gap begins to close.', 'Keeping possession is useful when the timing or weight of the forward pass is uncertain. Scan again after the reset.'),
        ],
      },
      {
        id: 'pass-reset', title: 'A way out of pressure',
        prompt: 'You are high on the pitch and the forward lanes are blocked. Who can help?',
        picture: 'You are high on the right. A is straight ahead behind an opponent. B is behind and diagonally below you with a clear lane. C is directly below you behind another opponent.',
        hint: 'Your next useful pass does not have to go closer to goal.',
        seniorHint: 'Find a supporting angle that takes the ball out of the pressing area.',
        you: p(59, 19), ball: p(59, 19), teammates: [p(83, 19), p(38, 42), p(60, 55)], opponents: [p(70, 19), p(59, 33), p(82, 48)],
        choices: [
          choice('A', 'Force the forward pass to A', 83, 19, 'pass', 'look-again', 'The opponent can step into this lane. Look for help outside the pressure.', 'Passing towards goal is not always progress if the ball cannot reach the receiver.'),
          choice('B', 'Reset through B', 38, 42, 'pass', 'opens-play', 'B gives you an angled route out. Your team can keep the ball and look for a fresh opening.', 'Supporting behind the ball helps escape pressure. B can scan the far side while the pass travels.'),
          choice('C', 'Pass down to C', 60, 55, 'pass', 'look-again', 'Another opponent blocks this route. Check the whole passing lane before choosing C.', 'The receiver’s distance from goal is less important here than the defender positioned between you.'),
        ],
      },
      {
        id: 'pass-pressure', title: 'The defender steps towards you',
        prompt: 'An opponent is closing you down. Which pass uses the space beside them?',
        picture: 'You have the ball in the middle with an opponent just ahead. A is diagonally ahead and high; B is directly behind that opponent; C is behind and low.',
        hint: 'When someone moves towards the ball, a space may open beside them.',
        seniorHint: 'Release the ball before pressure closes the lane; check the receiver’s next action too.',
        you: p(44, 38), ball: p(44, 38), teammates: [p(63, 13), p(69, 38), p(38, 60)], opponents: [p(52, 38), p(79, 22), p(81, 56)],
        choices: [
          choice('A', 'Pass beside the defender to A', 63, 13, 'pass', 'opens-play', 'A is beside the pressure with room to receive. An early angled pass can use that space.', 'Drawing an opponent towards the ball can free a teammate, but delaying too long may close your passing options.'),
          choice('B', 'Pass through the defender to B', 69, 38, 'pass', 'look-again', 'The closing opponent is in the way. Try a lane beside them instead.', 'A straight pass needs a clear line. B could help by moving to a new angle.'),
          choice('C', 'Keep possession through C', 38, 60, 'pass', 'another-option', 'C gives you a clear way to keep the ball. You can use this support if the forward angle disappears.', 'Resetting behind the pressure is a useful alternative. Communicate so C knows where the opponent is coming from.'),
        ],
      },
      {
        id: 'pass-combination', title: 'Think one pass ahead',
        prompt: 'The direct pass is blocked. Who could help your team build another route?',
        picture: 'You are left of centre. A is a short diagonal pass high on the pitch. B is much farther ahead behind a central defender. C is close behind you.',
        hint: 'A short pass can be the start of a bigger move.',
        seniorHint: 'Look for an angle that could support a combination, without assuming your teammate’s next pass.',
        you: p(23, 39), ball: p(23, 39), teammates: [p(37, 15), p(73, 39), p(18, 59)], opponents: [p(44, 39), p(59, 23), p(79, 53)],
        choices: [
          choice('A', 'Connect with A', 37, 15, 'pass', 'opens-play', 'A offers a clear short pass and a new angle. Move to support after you pass.', 'A combination can create a route around a defender. Your next movement should respond to what A sees.'),
          choice('B', 'Try the long direct pass to B', 73, 39, 'pass', 'look-again', 'A defender blocks the direct route to B. Try connecting through a different angle first.', 'A longer pass through a blocked lane adds risk without removing the defender from the play.'),
          choice('C', 'Use the close support from C', 18, 59, 'pass', 'another-option', 'C is nearby with a clear lane. Keeping the ball gives everyone time to move into new spaces.', 'Short support behind the ball can rebuild the passing shape. Stay available rather than watching after your pass.'),
        ],
      },
    ],
  },
  {
    id: 'space', mode: 'player', title: 'Find the Space', focus: 'Move to help a teammate.',
    description: 'Move your player to give the ball carrier a useful option.',
    instruction: 'Your teammate has the ball. Tap A, B or C to choose where you move.',
    scenarios: [
      {
        id: 'space-angle', title: 'Step out of the shadow',
        prompt: 'A defender is between you and the ball. Where could you offer a clearer pass?',
        picture: 'The ball is left of centre; you are ahead of it behind a defender. A is high and ahead of the ball; B is your current spot; C is behind the ball and low.',
        hint: 'Move sideways enough for your teammate to see a clear lane to you.',
        seniorHint: 'Change your receiving angle to leave the defender’s cover shadow.',
        you: p(55, 36), ball: p(28, 36), teammates: [p(28, 36), p(77, 55)], opponents: [p(42, 36), p(73, 21)],
        choices: [
          choice('A', 'Move diagonally to A', 52, 14, 'move', 'opens-play', 'This movement takes you out from behind the defender. Your teammate can see a new passing lane.', 'Moving across the defender’s line of cover changes the angle without needing to get closer to the ball.'),
          choice('B', 'Stay at B', 55, 36, 'hold', 'look-again', 'The defender still blocks the pass. Try a different angle to become easier to find.', 'Standing beyond an opponent is not enough if the ball carrier cannot pass around that opponent.'),
          choice('C', 'Offer support at C', 24, 58, 'move', 'another-option', 'You give your teammate a clear pass behind the ball. That can help if they need to keep possession.', 'Support behind the ball creates a reset option. Check which teammates already provide that support.'),
        ],
      },
      {
        id: 'space-width', title: 'Make the pitch bigger',
        prompt: 'Your teammate is in the middle. Where could you add width?',
        picture: 'The ball is in the centre. You start high and a little ahead. A is wider and farther ahead on the high side; B is next to the ball carrier; C is behind the ball on the high side.',
        hint: 'You can help without running straight towards the ball.',
        seniorHint: 'Width stretches the defending shape and gives the ball carrier a diagonal option.',
        you: p(55, 22), ball: p(51, 38), teammates: [p(51, 38), p(25, 43), p(79, 56)], opponents: [p(65, 38), p(60, 17), p(83, 40)],
        choices: [
          choice('A', 'Move wide to A', 77, 12, 'move', 'opens-play', 'You give the ball carrier a wide option with space around it. Keep looking as you move.', 'Width can pull the defence apart. Adjust your distance so the pass remains realistic for your teammate.'),
          choice('B', 'Run beside the ball at B', 56, 39, 'move', 'look-again', 'You arrive very close to your teammate. This crowds the ball instead of adding a new passing angle.', 'Close support can help in some situations, but here the unoccupied wide space offers more room.'),
          choice('C', 'Support behind at C', 31, 15, 'move', 'another-option', 'This gives a clear supporting angle behind the ball. It is useful if your teammate needs a reset.', 'A team needs balance as well as width ahead. Check the existing support before choosing your movement.'),
        ],
      },
      {
        id: 'space-distance', title: 'Be close enough to help',
        prompt: 'Your teammate is near the corner of the pitch. Where could you make a reachable pass?',
        picture: 'The ball is high on the left. You are far away in the middle. A is diagonally closer below the ball; B is far ahead on the same side; C is close below the ball. A defender blocks a long straight pass.',
        hint: 'Think about a pass your teammate can reach, not just an empty patch of grass.',
        seniorHint: 'Support distance depends on pressure and the passer’s range. Offer a clear angle within that range.',
        you: p(60, 31), ball: p(17, 17), teammates: [p(17, 17), p(77, 55)], opponents: [p(32, 20), p(61, 49)],
        choices: [
          choice('A', 'Come closer at A', 36, 43, 'move', 'opens-play', 'You offer a clearer, shorter diagonal pass. Coming closer can help a teammate under pressure.', 'A supporting angle and a manageable distance give the passer a useful outlet away from the defender.'),
          choice('B', 'Run much farther away to B', 77, 13, 'move', 'look-again', 'There is space, but you are a long way away with a defender near the lane. An easier supporting pass may help more.', 'Empty space is only useful if the ball can reach it. Judge your movement from the passer’s situation.'),
          choice('C', 'Make a short option at C', 17, 37, 'move', 'another-option', 'You become a close, clear option down the side. Stay ready to move again after the pass.', 'This short outlet can relieve pressure. Scan before receiving so you do not become trapped near the touchline.'),
        ],
      },
      {
        id: 'space-behind', title: 'Help from behind the ball',
        prompt: 'The forward route is crowded. Where could you offer a way to keep the ball?',
        picture: 'The ball is low on the right. You are behind and close by. A is behind the ball towards the middle; B is ahead beside a defender; C is behind the ball near the low side.',
        hint: 'Support can be behind the ball as well as in front.',
        seniorHint: 'Create a reset angle outside the immediate pressing area.',
        you: p(48, 51), ball: p(62, 53), teammates: [p(62, 53), p(29, 15)], opponents: [p(63, 38), p(79, 51), p(87, 23)],
        choices: [
          choice('A', 'Drop diagonally to A', 43, 27, 'move', 'opens-play', 'You offer a clear pass back into the middle. Your teammate has a way out of the crowded area.', 'A diagonal reset can change the point of attack and put the next receiver outside the pressure.'),
          choice('B', 'Wait next to the defender at B', 84, 52, 'move', 'look-again', 'The defender is close to this route. Try to make yourself easier to pass to.', 'Moving ahead of the ball is less useful when the receiver is immediately covered and the lane is blocked.'),
          choice('C', 'Support behind at C', 40, 61, 'move', 'another-option', 'You give your teammate a short pass behind the ball. Look up before receiving near the side.', 'This keeps possession, although the more central angle at A may give the next player more directions to play.'),
        ],
      },
      {
        id: 'space-pocket', title: 'Find a pocket',
        prompt: 'There is a space between opponents. Can you offer a pass there?',
        picture: 'The ball is left of centre and you start low. A is in a central gap beyond two defenders; B is beside the lower defender; C is behind the ball and low.',
        hint: 'Look for a clear lane into the gap, then check the space around you.',
        seniorHint: 'A pocket between lines is useful only while the passing lane and receiving space stay open.',
        you: p(51, 58), ball: p(35, 38), teammates: [p(35, 38), p(83, 59)], opponents: [p(57, 25), p(57, 50), p(80, 36)],
        choices: [
          choice('A', 'Move into the pocket at A', 66, 37, 'move', 'opens-play', 'You find space between the opponents with a clear route from the ball. Check over your shoulder before it arrives.', 'Time the movement so the passer sees you. Keep adjusting rather than treating the pocket as a fixed spot.'),
          choice('B', 'Stand beside the opponent at B', 59, 55, 'move', 'look-again', 'You are still close to the opponent. A few steps into a clearer space could make the pass easier.', 'Check both the lane and the pressure you would receive under. Availability is more than being visible.'),
          choice('C', 'Offer a pass back at C', 33, 61, 'move', 'another-option', 'You offer a clear reset. This can help if the central gap closes before the pass is made.', 'Support behind the ball provides balance. The forward pocket is an option, not an instruction to force the pass.'),
        ],
      },
      {
        id: 'space-after-pass', title: 'Pass, then help again',
        prompt: 'You have just passed to your teammate. Where could you offer the next option?',
        picture: 'You are left of centre after passing to a teammate ahead. A is a new diagonal angle high on the pitch; B is the ball carrier’s spot; C is behind and low. A defender is near the old passing lane.',
        hint: 'After a pass, find a new angle instead of following the ball.',
        seniorHint: 'Reposition to support the receiver’s next action while staying out of the same passing line.',
        you: p(30, 38), ball: p(58, 32), teammates: [p(58, 32), p(82, 16)], opponents: [p(46, 37), p(71, 52), p(83, 39)],
        choices: [
          choice('A', 'Offer a new angle at A', 46, 13, 'move', 'opens-play', 'You create a fresh diagonal option. Passing is the start of your next helpful movement.', 'Moving out of the previous passing line can create a return pass from a different angle.'),
          choice('B', 'Run onto the ball carrier at B', 58, 32, 'move', 'look-again', 'Running to the same spot crowds your teammate. Look for a space they could pass into instead.', 'Support should give the receiver another decision, rather than bring two attackers into one space.'),
          choice('C', 'Stay available behind at C', 39, 62, 'move', 'another-option', 'You offer a pass back on another angle. Your teammate can use you if the forward routes close.', 'Keeping a supporting position behind the ball can balance the attack. Remain connected as play moves.'),
        ],
      },
    ],
  },
  {
    id: 'next', mode: 'ball', title: 'What Happens Next?', focus: 'Choose a move. Explore the possibilities.',
    description: 'Pass, carry, shoot or protect the ball. Work out what the moment needs.',
    instruction: 'You have the ball. Tap A, B or C to choose your next action.',
    scenarios: [
      {
        id: 'next-carry', title: 'Grass in front of you',
        prompt: 'There is room ahead before the nearest opponent. What could you do?',
        picture: 'You are left of centre with clear grass ahead. The nearest opponent is farther ahead in the middle. A carries into that grass; B passes behind to a teammate; C shoots from far away through defenders.',
        hint: 'Look at the space between you and the nearest opponent.',
        seniorHint: 'Carrying can commit a defender and change the next passing picture. Keep scanning while you travel.',
        you: p(32, 36), ball: p(32, 36), teammates: [p(27, 60), p(73, 58)], opponents: [p(67, 36), p(76, 15), p(86, 55)],
        choices: [
          choice('A', 'Carry into the space', 51, 35, 'carry', 'opens-play', 'You can use the clear grass with controlled touches. Look up again before reaching the defender.', 'Carrying forward can draw pressure and free a teammate. The decision changes as the defender approaches.'),
          choice('B', 'Pass back to support', 27, 60, 'pass', 'another-option', 'Your teammate offers a clear pass. Keeping possession is useful, though you also have room to travel.', 'Match the decision to your team’s plan. Space to carry is an opportunity rather than a requirement.'),
          choice('C', 'Shoot from here', 98, 36, 'shoot', 'look-again', 'You are far from goal with an opponent in the way. Getting closer or finding a teammate could create a clearer chance.', 'Consider distance, pressure and the shooting lane together. This snapshot offers room to improve the position first.'),
        ],
      },
      {
        id: 'next-pressure', title: 'Two opponents close in',
        prompt: 'Two opponents are ahead of you. How could you keep the ball moving?',
        picture: 'You have the ball centrally. Two opponents are close ahead, one high and one low. A passes back diagonally to a free teammate; B dribbles between the opponents; C passes forward across the lower opponent.',
        hint: 'Find a teammate outside the pressure before the space closes.',
        seniorHint: 'Compare the support pass with the narrow gap. Early release may avoid a difficult duel.',
        you: p(55, 34), ball: p(55, 34), teammates: [p(34, 16), p(82, 56)], opponents: [p(62, 26), p(64, 42), p(87, 24)],
        choices: [
          choice('A', 'Pass out of pressure', 34, 16, 'pass', 'opens-play', 'Your teammate has a clear lane outside the pressure. An early pass helps your team keep possession.', 'The support pass takes the ball away from both pressing opponents and gives the next receiver more time.'),
          choice('B', 'Dribble between both opponents', 73, 34, 'carry', 'look-again', 'The gap is narrow and both opponents can close it. Look for support before trying to beat two players.', 'A dribble may work in a different picture, but here the nearby support offers less pressure and a clearer route.'),
          choice('C', 'Force the forward pass', 82, 56, 'pass', 'look-again', 'The lower opponent is close to this passing lane. Check another angle instead of forcing the ball forward.', 'A teammate beyond pressure is not enough; the pass needs to get through the pressure too.'),
        ],
      },
      {
        id: 'next-square', title: 'A teammate has a clearer view',
        prompt: 'A defender is blocking your route to goal. What could create a clearer chance?',
        picture: 'You are high on the right with a defender between you and goal. A shoots through that defender; B passes down to a free teammate nearer the middle; C carries back into space. The goalkeeper is in goal.',
        hint: 'Check whether a teammate has a clearer route than you.',
        seniorHint: 'Compare your shooting lane with the angle available to the supporting attacker.',
        you: p(78, 27), ball: p(78, 27), teammates: [p(80, 53), p(62, 13)], opponents: [p(87, 29), p(95, 36), p(65, 57)],
        choices: [
          choice('A', 'Shoot through the defender', 98, 32, 'shoot', 'look-again', 'The defender is in your shooting lane. A teammate may have a clearer angle.', 'A quick shot is useful when a lane is open. Here the defender has a good chance to block it.'),
          choice('B', 'Pass across to your teammate', 80, 53, 'pass', 'opens-play', 'Your teammate has room on the other side of the defender. Sharing the ball can create a clearer next action.', 'A pass across the defender changes the shooting angle. The receiver still needs to assess the goalkeeper and any recovering pressure.'),
          choice('C', 'Carry back into space', 69, 16, 'carry', 'another-option', 'You can move away from the defender to keep the ball. Look up for a new passing or shooting lane.', 'Recycling the attack can help when a chance is blocked. Use controlled touches and reassess the supporting options.'),
        ],
      },
      {
        id: 'next-finish', title: 'A chance to finish',
        prompt: 'You are close to goal with a clear lane. What could you try?',
        picture: 'You are centrally close to the right goal. The goalkeeper is lower in the goal. A shoots towards the higher part of the goal; B passes back to a teammate high on the pitch; C dribbles towards the goalkeeper.',
        hint: 'Look at the goal and the goalkeeper before choosing.',
        seniorHint: 'A controlled finish can use an open lane before recovering defenders arrive.',
        you: p(83, 38), ball: p(83, 38), teammates: [p(70, 13), p(51, 58)], opponents: [p(66, 25), p(75, 55), p(96, 44)],
        choices: [
          choice('A', 'Try a controlled shot', 98, 32, 'shoot', 'opens-play', 'There is a clear lane from close to goal. A controlled shot is a useful choice here; a goal is never guaranteed.', 'Check the goalkeeper’s position and the ball’s position relative to your body. Aim and balance matter more than hitting as hard as possible.'),
          choice('B', 'Keep the ball with a pass', 70, 13, 'pass', 'another-option', 'You can keep possession with your teammate. Look at the open shooting chance too before you decide.', 'A supporting pass remains an option if your balance or touch prevents a clean finish. The picture alone cannot show everything.'),
          choice('C', 'Take the ball towards the keeper', 91, 53, 'carry', 'look-again', 'This takes you closer to the goalkeeper and narrows your space. Notice the shooting lane you already have.', 'An extra touch is useful when it improves the chance. Here it can allow the goalkeeper to close the angle.'),
        ],
      },
      {
        id: 'next-protect', title: 'Keep it near the touchline',
        prompt: 'An opponent is closing you down near the side. What could help?',
        picture: 'You have the ball low on the pitch near the touchline. An opponent approaches from ahead. A protects the ball at your current spot; B passes back diagonally to support; C dribbles forward nearer the touchline and opponent.',
        hint: 'Notice your teammate behind you and the limited room beside the touchline.',
        seniorHint: 'Compare releasing the ball with protecting it briefly while support adjusts.',
        you: p(56, 58), ball: p(56, 58), teammates: [p(36, 39), p(76, 24)], opponents: [p(65, 56), p(78, 45), p(87, 19)],
        choices: [
          choice('A', 'Protect the ball briefly', 56, 58, 'hold', 'another-option', 'You can keep your body between the opponent and the ball while looking for support. Keep your arms controlled.', 'Protecting can buy a moment for a passing option. Avoid pushing or holding the opponent and be ready to release the ball.'),
          choice('B', 'Pass back to support', 36, 39, 'pass', 'opens-play', 'A clear support pass takes the ball away from the touchline pressure. Then move to help again.', 'Releasing early prevents the opponent using the touchline to limit your options.'),
          choice('C', 'Dribble towards the touchline', 76, 63, 'carry', 'look-again', 'This leaves little room and brings you nearer the opponent. Check the pass behind you.', 'The touchline reduces the directions you can use. A dribble needs a clear exit rather than simply moving forward.'),
        ],
      },
      {
        id: 'next-reset', title: 'Forward is blocked',
        prompt: 'The defending team has closed the middle. What could your team do next?',
        picture: 'You have the ball in the centre. A dribbles straight into the nearest defender; B passes back high to a teammate; C passes back low to another teammate. Both supporting lanes are clear.',
        hint: 'A pass back can be the start of a new attack.',
        seniorHint: 'Change the point of attack instead of repeatedly playing into a compact defence.',
        you: p(46, 35), ball: p(46, 35), teammates: [p(34, 13), p(28, 57)], opponents: [p(61, 35), p(75, 22), p(75, 49)],
        choices: [
          choice('A', 'Dribble straight ahead', 61, 35, 'carry', 'look-again', 'The defender is waiting in that space. Look for a new route instead of running into the pressure.', 'A compact central defence can make straight-line progress difficult. Move the ball to change the defenders’ positions.'),
          choice('B', 'Reset through the high side', 34, 13, 'pass', 'opens-play', 'You keep the ball and change the angle. Your teammate can look for space on another side.', 'Resetting gives the team another view of the defensive shape. Follow the pass with useful support.'),
          choice('C', 'Reset through the low side', 28, 57, 'pass', 'opens-play', 'This is also a clear supporting pass. More than one choice can help your team keep playing.', 'Both reset lanes are available in this snapshot. Communication, the next pass and your team’s plan can help you choose between them.'),
        ],
      },
    ],
  },
  {
    id: 'touch', mode: 'receive', title: 'First-Touch Choices', focus: 'Your first touch sets up your next move.',
    description: 'See a pass coming, scan the pressure and choose where to take your touch.',
    instruction: 'A pass is coming to you. Tap A, B or C to choose your first-touch direction.',
    scenarios: [
      {
        id: 'touch-away', title: 'Away from the pressure',
        prompt: 'An opponent is on your right. Where could your first touch give you room?',
        picture: 'The pass comes from the left to you in the middle. An opponent is just to your right. A takes the touch high into clear space; B goes towards the opponent; C goes backwards and low.',
        hint: 'Look for a space away from the nearest opponent.',
        seniorHint: 'Scan before the pass arrives so your first contact can move the ball away from pressure.',
        you: p(47, 36), ball: p(18, 39), teammates: [p(18, 39), p(79, 16)], opponents: [p(59, 36), p(77, 55)],
        choices: [
          choice('A', 'Touch into the high space', 47, 17, 'touch', 'opens-play', 'Your touch takes the ball away from the opponent. Keep it close enough to reach your next action.', 'Use the information from your scan to choose the contact surface and direction. The arrow shows direction, not a required touch distance.'),
          choice('B', 'Touch towards the opponent', 63, 36, 'touch', 'look-again', 'This takes the ball towards the pressure. Check the clear space on another side.', 'A first touch that enters the defender’s reach may remove your next option, even if it moves the ball forward.'),
          choice('C', 'Touch back into space', 34, 53, 'touch', 'another-option', 'A touch back can help you keep the ball away from the opponent. Look up again for your next pass.', 'Receiving away from goal can still protect possession. Check that the supporting space remains clear as the ball arrives.'),
        ],
      },
      {
        id: 'touch-open', title: 'See the next pass',
        prompt: 'A teammate is ahead on the high side. Where could your touch help you see them?',
        picture: 'The pass comes diagonally from behind and low to you in the middle. An opponent is behind you and low. A takes the ball diagonally ahead and high towards a free teammate; B goes back and high; C goes towards the opponent.',
        hint: 'Can you receive facing the space you want to use next?',
        seniorHint: 'An open body position can help you see the incoming ball and the next passing option.',
        you: p(54, 36), ball: p(24, 57), teammates: [p(24, 57), p(80, 19)], opponents: [p(57, 55), p(83, 47)],
        choices: [
          choice('A', 'Open towards the forward space', 67, 23, 'touch', 'opens-play', 'Your touch opens a view of your teammate ahead. Scan, control, then choose whether the pass is still on.', 'Receiving across your body may help open the pitch when pressure allows. Choose the foot and surface that fit the actual pass.'),
          choice('B', 'Keep it on the high side behind you', 43, 23, 'touch', 'another-option', 'You still receive away from pressure. You may need another look or touch to connect forwards.', 'A controlled touch that retains the ball is useful even when it does not immediately open the forward passing lane.'),
          choice('C', 'Touch down towards the opponent', 55, 55, 'touch', 'look-again', 'The opponent is in this space. Try to receive away from them.', 'The pass comes from behind, so checking your surroundings before it arrives helps you avoid turning into pressure.'),
        ],
      },
      {
        id: 'touch-control', title: 'Keep the next touch reachable',
        prompt: 'An opponent is waiting ahead. Which touch keeps the ball under control?',
        picture: 'The pass comes from the left to you right of centre. A is a short touch diagonally high; B is a much longer touch towards a defender; C is a touch back and high into space.',
        hint: 'A bigger touch is not always a better touch.',
        seniorHint: 'Match the weight of your touch to the available space and your distance from the opponent.',
        you: p(67, 36), ball: p(38, 29), teammates: [p(38, 29), p(81, 13)], opponents: [p(83, 36), p(70, 55)],
        choices: [
          choice('A', 'Take a small angled touch', 73, 28, 'touch', 'opens-play', 'This keeps the ball nearby and away from the defender. You can look up for your next choice.', 'A softer contact can preserve your ability to pass, carry or protect. Adjust to the pace of the incoming ball.'),
          choice('B', 'Push the ball far ahead', 89, 37, 'touch', 'look-again', 'A heavy touch brings the ball towards the opponent before you can play again.', 'A longer touch can suit open space, but here the defender is close enough to challenge it.'),
          choice('C', 'Control back into space', 53, 18, 'touch', 'another-option', 'You receive away from the pressure and keep another option. Turn your attention to the next pass.', 'Retaining control can matter more than the direction of travel. Check behind before choosing a backwards touch.'),
        ],
      },
      {
        id: 'touch-line', title: 'Use the room inside',
        prompt: 'You are near the low touchline. Where could you receive with more room?',
        picture: 'The pass comes from the left and high to you near the low touchline. An opponent is ahead and high. A touches inwards towards the middle; B goes forward nearer the touchline; C goes back along the side.',
        hint: 'Which direction gives you more pitch to use?',
        seniorHint: 'Use your scan to compare the inside space with the touchline’s limited exit routes.',
        you: p(53, 59), ball: p(28, 41), teammates: [p(28, 41), p(77, 19)], opponents: [p(68, 53), p(81, 37)],
        choices: [
          choice('A', 'Touch inwards', 49, 42, 'touch', 'opens-play', 'The inside space gives you more directions to play. Keep the touch controlled and look up again.', 'Receiving inwards can avoid being trapped against the touchline, provided the central space stays free.'),
          choice('B', 'Touch nearer the touchline', 66, 65, 'touch', 'look-again', 'This leaves little room and moves you nearer the opponent. Notice the space inside instead.', 'The line limits your next action. Use it as part of your decision rather than taking every touch forwards.'),
          choice('C', 'Control back along the side', 35, 57, 'touch', 'another-option', 'You can keep the ball away from the opponent and reconnect with support behind you.', 'A backwards receiving direction can keep possession, although you still need to scan for pressure near the touchline.'),
        ],
      },
      {
        id: 'touch-settle', title: 'Settle a lively pass',
        prompt: 'The pass arrives with a little bounce. What could help you stay in control?',
        picture: 'A bouncing pass comes from the left to you in the centre. There is clear space nearby and an opponent farther ahead. A cushions the ball close; B knocks it far ahead towards the opponent; C settles it diagonally low.',
        hint: 'You can take a moment to control before playing the next pass.',
        seniorHint: 'Adjust your body and contact to the flight of the ball. Absorb its pace rather than adding more.',
        you: p(49, 35), ball: p(18, 26), teammates: [p(18, 26), p(77, 57)], opponents: [p(72, 35), p(83, 15)],
        choices: [
          choice('A', 'Cushion it close', 57, 24, 'touch', 'opens-play', 'A gentle contact can help settle the ball close by. Get balanced, then look for your next action.', 'Let the appropriate contact surface absorb some pace. The best surface depends on the ball’s height and the pressure.'),
          choice('B', 'Knock it a long way ahead', 73, 35, 'touch', 'look-again', 'This puts the ball near the opponent. Try settling it where you can reach it first.', 'Adding distance before controlling a bouncing ball can hand the next touch to the defender.'),
          choice('C', 'Settle into the low space', 45, 53, 'touch', 'another-option', 'You can use the clear side space if you keep the touch within reach. Control comes before rushing.', 'A receiving angle can protect the ball as well as settle it. Adjust to the bounce rather than deciding the touch distance in advance.'),
        ],
      },
      {
        id: 'touch-connect', title: 'Prepare the next action',
        prompt: 'You want to connect with the teammate ahead and high. Where could you receive?',
        picture: 'The pass comes from behind and high to you in the middle. A takes a touch into the high space towards a teammate; B goes diagonally low onto an opponent; C takes the ball backwards towards another supporting teammate.',
        hint: 'Think about what you want to do after the first touch.',
        seniorHint: 'A purposeful first touch sets the ball and your body for the next pass, without ignoring new pressure.',
        you: p(54, 35), ball: p(26, 15), teammates: [p(26, 15), p(76, 13), p(36, 58)], opponents: [p(67, 46), p(81, 30)],
        choices: [
          choice('A', 'Touch towards the high passing lane', 62, 23, 'touch', 'opens-play', 'This prepares a clear view of your teammate. Check the lane again before making the pass.', 'The touch can set your passing angle and body position together. New pressure may still change your next decision.'),
          choice('B', 'Touch down into pressure', 67, 46, 'touch', 'look-again', 'An opponent occupies this space. Your first touch can choose a clearer direction.', 'Planning the next action starts with recognising pressure. Moving onto the defender reduces the time for your next pass.'),
          choice('C', 'Receive back towards support', 43, 41, 'touch', 'another-option', 'You keep the ball and can use the teammate behind you. That remains useful if the forward pass closes.', 'Preparing a reset is a valid choice. Re-scan to judge whether forward connection or retention best fits the moment.'),
        ],
      },
    ],
  },
  ...extraFootballActivities,
];

export const totalActivityScenarios = footballActivities.reduce((total, activity) => total + activity.scenarios.length, 0);

export function activityRoute(activity: FootballActivity, scenario: ActivityScenario, selected: ActivityChoice) {
  const start = activity.mode === 'ball' ? scenario.ball : scenario.you;
  const end = selected.at;
  const point = (p: PitchPoint) => `${p.x},${p.y}`;
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const t = distance ? 1 - Math.min(10 / distance, 1 / 3) : 1;
  if (selected.kind === 'loft') {
    const control = { x: (start.x + end.x) / 2, y: Math.max(7, Math.min(start.y, end.y) - 18) };
    const cutControl = { x: start.x + t * (control.x - start.x), y: start.y + t * (control.y - start.y) };
    const cutEnd = { x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x, y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y };
    return { start, path: `M${point(start)} Q${point(control)} ${point(end)}`, arrowPath: `M${point(start)} Q${point(cutControl)} ${point(cutEnd)}` };
  }
  const cutEnd = { x: start.x + t * (end.x - start.x), y: start.y + t * (end.y - start.y) };
  return { start, path: `M${point(start)} L${point(end)}`, arrowPath: `M${point(start)} L${point(cutEnd)}` };
}

const scenarioIds = new Set(footballActivities.flatMap(a => a.scenarios.map(s => s.id)));
export type ActivityMarker = 'activity' | 'favourite';
export function activityMarker(kind: ActivityMarker, scenarioId: string) {
  if (!scenarioIds.has(scenarioId)) throw new Error('Choose an available activity scenario.');
  return `${kind}:${scenarioId}`;
}

export function activityProgress(progress: LearningProgress[], playerId: string) {
  const explored = new Set<string>(), favourites = new Set<string>(), mastered = new Set<string>();
  for (const row of progress) {
    if (row.player_id !== playerId) continue;
    const split = row.lesson_id.indexOf(':'), kind = row.lesson_id.slice(0, split), id = row.lesson_id.slice(split + 1);
    if (!scenarioIds.has(id)) continue;
    if (kind === 'activity') explored.add(id);
    if (kind === 'favourite') favourites.add(id);
    if (kind === 'mastery') mastered.add(id);
  }
  return { explored, favourites, mastered };
}

export function nextUnexploredScenario(activity: FootballActivity, explored: Set<string>) {
  const next = activity.scenarios.findIndex(s => !explored.has(s.id));
  return next < 0 ? 0 : next;
}

export async function saveActivityProgress(playerId: string, scenarioId: string, kind: ActivityMarker,
  value: boolean, save: PortalFeatureActions['onLearningProgress']) {
  const marker = activityMarker(kind, scenarioId);
  await save(playerId, marker, value);
  return marker;
}
