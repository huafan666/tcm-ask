module.exports = {
  name: 'spasm_any',
  title: '抽筋痉挛（肌肉不自主动）',
  kind: 'symptom_group',
  // 症状筛选组（状态）：抽筋痉挛（肌肉不自主动）
  trigger(text) { return ['抽搐', '抽筋', '痉挛', '抽风', '肉跳', '动摇'].some(k => text.includes(k)) },
  ask: '是不是有抽动、抽搐或者肌肉自己跳？',
  children: ['muscle_twitching', 'limb_spasm', 'limb_straight_spasm', 'epileptic_seizure', 'du_tou_dong_yao'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：状态｜未归入本组的：肢体麻木（是感觉异常）、站立不稳、半身不遂']
}
