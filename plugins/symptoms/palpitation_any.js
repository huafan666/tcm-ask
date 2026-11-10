module.exports = {
  name: 'palpitation_any',
  title: '心慌心悸',
  kind: 'symptom_group',
  // 症状筛选组（感觉）：心慌心悸
  trigger(text) { return ['心慌', '心悸', '心跳', '悸动', '心窝跳'].some(k => text.includes(k)) },
  ask: '是不是心慌、心跳不安，或者心口窝/肚脐下跳动？',
  children: ['heart_palp', 'below_palp', 'ben_tun'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：感觉｜未归入本组的：心痛（是痛不是悸）、气上冲（是气逆感）']
}
