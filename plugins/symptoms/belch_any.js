module.exports = {
  name: 'belch_any',
  title: '嗳气打嗝（胃里的气从嘴里出来）',
  kind: 'symptom_group',
  // 症状筛选组（动作）：嗳气打嗝（胃里的气从嘴里出来）
  trigger(text) { return ['嗳气', '打嗝', '噫气', '呃逆', '哕'].some(k => text.includes(k)) },
  ask: '是不是会打嗝、嗳气——胃里的气从嘴里返出来？',
  children: ['belching', 'belch_food_smell', 'hiccup'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：动作｜未归入本组的：呕吐（带出东西）、叹气']
}
