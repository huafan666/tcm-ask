module.exports = {
  name: 'body_pain_any',
  title: '身体四肢疼痛（头颈以下）',
  kind: 'symptom_group',
  // 症状筛选组（部位）：身体四肢疼痛（头颈以下）
  trigger(text) { return ['身上痛', '身痛', '浑身痛', '关节痛', '腰腿痛', '足跟痛', '腰痛'].some(k => text.includes(k)) },
  ask: '是不是身上、关节或者手脚疼？',
  children: ['body_pain', 'body_ache_stiff', 'joint_pain_rigid', 'joint_pain_severe', 'migratory_pain', 'yaguan_tong', 'zugengtong', 'lower_back_pain', 'joint_red_hot', 'joint_cold_aggravated'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：部位｜未归入本组的：头痛/颈痛（归 head_pain_any）、胸腹痛（归胸腹系统）、腰酸（酸不是痛，归 lowback_any）']
}
