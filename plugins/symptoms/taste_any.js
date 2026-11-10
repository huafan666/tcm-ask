module.exports = {
  name: 'taste_any',
  title: '口中味觉异常',
  kind: 'symptom_group',
  // 症状筛选组（感觉）：口中味觉异常
  trigger(text) { return ['口苦', '嘴里', '口酸', '味觉'].some(k => text.includes(k)) },
  ask: '是不是嘴里味道不对——发苦、发酸？',
  children: ['bitter_taste', 'wei_suan'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：感觉｜未归入本组的：口干（是燥不是味）、口臭']
}
