module.exports = {
  name: 'e_zu',
  title: '妊娠恶阻',
  kind: 'summary',
  // 金匮要略·妇人妊娠病脉证并治第二十：妇人得平脉……其人渴，不能食，无寒热，名妊娠……妊娠呕吐不止，干姜人参半夏丸主之。
  needs: [
    ['pregnancy.yes', 'pregnancy_vomit.yes'],
    ['pregnancy.yes', 'vomiting.yes', 'low_appetite.yes'],
    ['pregnancy.yes', 'vomiting.yes']
  ],
  contraindications: ['妊娠恶阻就是**怀孕后恶心呕吐、吃不下饭**，也就是常说的「孕吐」', '原文叫「恶阻」，认为病机是胃气上逆、脾胃虚弱', '轻的一般在怀孕 6 周左右出现、3 个月后自行缓解；轻证的思路是调和胃气（桂枝汤）', '重的「呕吐不止」用干姜人参半夏丸——**温中补虚、降逆止呕**（有干姜、人参护正）', '⚠ 妊娠期用药须极为谨慎，尤其活血、攻下、有毒之品一律禁用；剧烈呕吐无法进食、脱水、酮体的要住院补液（妊娠剧吐）']
}
