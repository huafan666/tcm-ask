module.exports = {
  name: 'dyspnea_any',
  title: '喘（呼吸急迫、接不上气）',
  kind: 'symptom_group',
  // 症状筛选组（动作）：喘（呼吸急迫、接不上气）
  trigger(text) { return ['喘', '气短', '短气', '上气', '呼吸困难', '接不上气', '气不够'].some(k => text.includes(k)) },
  ask: '是不是呼吸急迫、喘不上气，或者气不够用？',
  children: ['chuan', 'short_breath', 'orthopnea'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：动作｜未归入本组的：咳（咳嗽本身不算喘）、叹气、气上冲（那是气逆感）']
}
