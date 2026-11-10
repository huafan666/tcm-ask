module.exports = {
  name: 'houpo_mahuang_tang',
  title: '厚朴麻黄汤',
  kind: 'formula',
  // 金匮要略·肺痿肺痈咳嗽上气病脉证并治第七：咳而脉浮者，厚朴麻黄汤主之。
  needs: [
    ['cough.yes', 'chest_fullness.yes', 'fever.no'],
    ['cough.yes', 'chest_fullness.yes']
  ],
  contraindications: ['治咳嗽而病位偏上偏表（原文以「脉浮」定位，脉象按口径不入条件，改以胸满作代理）', '厚朴降气宽胸、麻黄宣肺，配石膏清郁热，杏仁、半夏、干姜、细辛、五味子化饮止咳，小麦养正', '偏寒饮郁热、胸闷咳嗽的证型']
}
