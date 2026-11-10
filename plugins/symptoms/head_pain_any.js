module.exports = {
  name: 'head_pain_any',
  title: '头部疼痛（头、颈）',
  kind: 'symptom_group',
  // 症状筛选组（部位）：头部疼痛（头、颈）
  trigger(text) { return ['头痛', '头疼', '项痛', '颈痛', '头胀痛'].some(k => text.includes(k)) },
  ask: '是不是头或脖子疼——头痛、偏头痛、脖子发紧发痛？',
  children: ['headache', 'neck_stiff_pain', 'fengchi_tong'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：部位｜未归入本组的：头晕（是晕不是痛，归 dizziness_any）、身上的痛（归 body_pain_any）']
}
