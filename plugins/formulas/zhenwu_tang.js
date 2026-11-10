module.exports = {
  name: 'zhenwu_tang',
  title: '真武汤',
  kind: 'formula',
  // 第82条: 太阳病发汗，汗出不解，其人仍发热，心下悸，头眩，身瞤动，振振欲擗地者，真武汤主之。
  // 阳虚水泛: 心下悸+头眩+身瞤动振振欲擗地。核心=心下悸+头眩(阳虚水泛肢体瞤动)。
  needs: [
    ['heart_palp.yes', 'dizziness.yes', 'cold_drink_desire.no'],
    ['heart_palp.yes', 'muscle_twitching.yes', 'cold_drink_desire.no'],
    ['heart_palp.yes', 'unsteady_stance.yes', 'cold_drink_desire.no'],
    ['dizziness.yes', 'muscle_twitching.yes', 'cold_drink_desire.no'],
    ['dizziness.yes', 'unsteady_stance.yes', 'cold_drink_desire.no'],
    ['urination_difficulty.yes', 'limb_heavy_powerless.yes', 'diarrhea.yes']
  ],
  contraindications: ['阳虚水泛(心下悸+头眩+身瞤动)', '发汗后阳虚、水气凌心', '温阳利水，忌再发汗']
}
