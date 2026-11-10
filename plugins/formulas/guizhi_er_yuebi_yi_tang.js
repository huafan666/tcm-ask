module.exports = {
  name: 'guizhi_er_yuebi_yi_tang',
  title: '桂枝二越婢一汤',
  kind: 'formula',
  // 27条：太阳病，发热恶寒，热多寒少，脉微弱者，此无阳也，不可发汗，宜桂枝二越婢一汤。
  needs: ['fever.yes', 'cold_aversion.yes', 'sweat.yes', 'thirsty.yes', 'severe_thirst.no'],
  contraindications: ['27条：发热恶寒、热多寒少，表邪未解而里有郁热', '桂枝汤 2 份 + 越婢汤 1 份，微汗兼清郁热', '原文「脉微弱者，此无阳也，不可发汗」——本方是微发其汗，不可当麻黄汤用', '⚠ 条文本身症状信息很少（只有发热恶寒、热多寒少），本方判据的可信度低于其它方']
}
