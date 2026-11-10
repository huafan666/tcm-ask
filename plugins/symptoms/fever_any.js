module.exports = {
  name: 'fever_any',
  title: '发热（身上热、体温高）',
  kind: 'symptom_group',
  // 症状筛选组（感觉）：发热（身上热、体温高）
  trigger(text) { return ['发热', '发烧', '身热', '灼热', '潮热', '壮热', '低烧', '高烧'].some(k => text.includes(k)) },
  ask: '是不是有发热——身上发烫、摸着手心热，或者量体温偏高？',
  children: ['fever', 'tidal_fever', 'alternating_cold_heat', 'zijue_shenre', 'burning', 'heat_only_no_chill', 'periodic_chill_fever', 'hand_foot_hot', 'shuangzu_re', 'heart_hot'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：感觉｜未归入本组的：真热假寒/真寒假热/里寒外热（那是证候判断不是发热症状）、烦躁、口渴']
}
