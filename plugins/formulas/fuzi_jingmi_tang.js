module.exports = {
  name: 'fuzi_jingmi_tang',
  title: '附子粳米汤',
  kind: 'formula',
  // 
  needs: [
    ['borborygmus.yes', 'duzijiaotonghuocitong.yes', 'vomiting.yes'],
    ['borborygmus.yes', 'severe_abdominal_pain.yes', 'vomiting.yes'],
    ['borborygmus.yes', 'vomiting.yes', 'cold_aversion.yes'],
    ['borborygmus.yes', 'duzijiaotonghuocitong.yes', 'cold_aversion.yes']
  ],
  contraindications: ['治腹中寒气：肚子咕噜响、绞痛（雷鸣切痛）、胸胁胀满气逆、呕吐', '附子温阳散寒，半夏降逆止呕，甘草、大枣、粳米补中缓急', '重点在「寒气」——一定伴随怕冷、腹部发凉', '附子有毒须炮制久煎', '「雷鸣切痛」的切痛指绞痛，与「肚子绞痛或刺痛」是同一类表现']
}
