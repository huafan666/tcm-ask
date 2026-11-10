module.exports = {
  name: 'bentun_tang',
  title: '奔豚汤',
  kind: 'formula',
  // 金匮要略·奔豚气病脉证并治第八：奔豚气上冲胸，腹痛，往来寒热，奔豚汤主之。
  needs: [
    ['ben_tun.yes', 'abdominal_pain.yes', 'alternating_cold_heat.yes'],
    ['ben_tun.yes', 'abdominal_pain.yes']
  ],
  contraindications: ['治奔豚偏「肝郁化热」的类型：气从下腹冲到胸口，同时肚子痛、一阵冷一阵热', '和桂枝加桂汤的区别：桂枝加桂汤是心阳虚、被外寒引发（多因烧针、针处被寒），偏寒；奔豚汤有往来寒热和腹痛，偏肝气郁而化热', '方中甘李根白皮是治奔豚的专药（李树根皮，苦咸寒，降逆下气），配葛根、黄芩清热，当归、川芎、芍药养血柔肝，半夏、生姜降逆', '原文服法是「日三夜一服」——白天三次、夜里一次，因为奔豚常在夜间发作']
}
