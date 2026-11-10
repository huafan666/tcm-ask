module.exports = {
  name: 'sweat_any',
  title: '出汗',
  kind: 'symptom_group',
  // 症状筛选组（动作）：出汗
  trigger(text) { return ['汗', '出汗', '冒汗', '透汗'].some(k => text.includes(k)) },
  ask: '是不是身上会出汗？',
  children: ['sweat', 'auto_sweat', 'night_sweat', 'cold_sweat', 'head_sweat_only', 'leak_sweat', 'yellow_sweat', 'waist_split_sweat', 'shouhan'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：动作｜未归入本组的：无汗（相反）；水肿、阴部潮湿不算出汗']
}
