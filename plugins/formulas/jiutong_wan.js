module.exports = {
  name: 'jiutong_wan',
  title: '九痛丸',
  kind: 'formula',
  // 金匮要略·胸痹心痛短气病脉证并治第九：九痛丸：治九种心痛。
  needs: [
    ['heart_hanging_pain.yes', 'abdominal_pain.yes'],
    ['heart_pain_radiate.yes', 'abdominal_pain.yes'],
    ['abdominal_pain.yes', 'cold_extremities.yes', 'heart_hanging_pain.yes']
  ],
  contraindications: ['治「九种心痛」——泛指多种心腹疼痛，包括兼治卒中恶、腹胀痛、口不能言，以及连年积冷、流注心胸痛', '五味：附子、生狼牙、巴豆、人参、干姜、吴茱萸——大辛大热、峻猛攻逐，配人参护正', '**巴豆是大毒峻下药**，狼牙亦有毒，做成蜜丸小量（强人三丸、弱者二丸），中病即止', '孕妇绝对忌用；体虚、腹泻者忌用', '原文还提到可治跌打坠落（落马坠车）引起的血瘀疼痛']
}
