module.exports = {
  name: 'stool_any',
  title: '大便异常',
  kind: 'symptom_group',
  // 症状筛选组（部位）：大便异常
  trigger(text) { return ['大便', '排便', '拉屎', '便干', '便硬'].some(k => text.includes(k)) },
  ask: '是不是大便有问题——不管拉稀、干硬、带血还是发黑？',
  children: ['diarrhea', 'chronic_diarrhea', 'clear_grain_diarrhea', 'duck_stool', 'qi_li', 'constipation', 'qingdubianmi', 'stool_blood', 'black_stool', 'blood_after_stool', 'blood_before_stool', 'blood_pus_stool', 'tenesmus'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：部位｜未归入本组的：放屁（是气不是大便）、肠鸣']
}
