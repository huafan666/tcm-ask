module.exports = {
  name: 'jiegeng_tang',
  title: '桔梗汤',
  kind: 'formula',
  // 第311条: 咽痛者可与甘草汤不差者与桔梗汤。
  // 咽痛较重(甘草不差),仍无下利。与甘草汤同判据(轻/重依用药层次)。
  needs: [
    ['throat_pain.yes', 'diarrhea.no'],
    // 金匮 7.13：咳而胸满……时出浊唾腥臭，久久吐脓如米粥者，为肺痈，桔梗汤主之
    ['fei_yong.yes', 'foul_pus_sputum.yes']
  ],
  contraindications: ['咽痛较重(甘草汤不差者)', '宣肺利咽(桔梗甘草)', '甘草汤轻、桔梗汤重', '咽痛兼下利用猪肤', '肺痈溃脓期排脓（金匮 7.13）']
}
