module.exports = {
  name: 'skin_any',
  title: '皮肤异常',
  kind: 'symptom_group',
  // 症状筛选组（部位）：皮肤异常
  trigger(text) { return ['皮肤', '身上痒', '起疹', '皮疹'].some(k => text.includes(k)) },
  ask: '是不是皮肤有问题——痒、起疹、干裂、渗水、溃烂或红肿？',
  children: ['skin_itch_hives', 'skin_scaly', 'skin_yang', 'oozing_skin', 'spreading_skin_sore', 'guoming_hongzhong', 'wound_injury'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：部位｜未归入本组的：面色/肤色（那是颜色不是皮损）、外伤伤口、内痈']
}
