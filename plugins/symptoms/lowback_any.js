module.exports = {
  name: 'lowback_any',
  title: '腰腿不适',
  kind: 'symptom_group',
  // 症状筛选组（部位）：腰腿不适
  trigger(text) { return ['腰', '腿酸', '腰腿'].some(k => text.includes(k)) },
  ask: '是不是腰或者腰腿这一带不舒服——酸、困、发凉？',
  children: ['yaosuan', 'yaotuisuankun', 'lower_back_cold'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：部位｜未归入本组的：腰痛如刺（痛归 pain_any）、小腿发凉（可另归 cold_any）']
}
