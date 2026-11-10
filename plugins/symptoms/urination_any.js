module.exports = {
  name: 'urination_any',
  title: '小便异常',
  kind: 'symptom_group',
  // 症状筛选组（部位）：小便异常
  trigger(text) { return ['小便', '尿', '排尿', '解手'].some(k => text.includes(k)) },
  ask: '是不是小便有问题——不管难尿、尿频、尿黄还是尿里有血？',
  children: ['urination_difficulty', 'easy_urination', 'frequent_urination', 'dark_urine', 'urine_incontinence', 'urine_gravel', 'polyuria', 'hematuria', 'xiaobian_dilou', 'xiaobian_fuli'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：部位｜未归入本组的：遗精/梦交（是精不是尿）、白带、水肿']
}
