module.exports = {
  name: 'thirst_any',
  title: '口渴（想喝水）',
  kind: 'symptom_group',
  // 症状筛选组（感觉）：口渴
  trigger(text) { return ['渴', '想喝水', '要喝水'].some(k => text.includes(k)) },
  ask: '是不是口渴、想喝水？',
  children: ['thirsty', 'severe_thirst'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：感觉｜未归入本组的：口干只想漱口不想咽（瘀血的特异表现，不算口渴）；嗓子发干、鼻子发干（是燥不是渴）']
}
