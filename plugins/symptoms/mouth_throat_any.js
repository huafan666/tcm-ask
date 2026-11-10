module.exports = {
  name: 'mouth_throat_any',
  title: '口咽部不适',
  kind: 'symptom_group',
  // 症状筛选组（部位）：口咽部不适
  trigger(text) { return ['咽', '喉', '嗓子', '口腔', '舌头', '鼻子', '说话'].some(k => text.includes(k)) },
  ask: '是不是嘴、嗓子、鼻子这块不舒服——痛、干、长疮、堵、吞咽不顺或者说话不利？',
  children: ['throat_pain', 'throat_dry', 'throat_ulcer', 'throat_lump_foreign', 'houlongjinsuo', 'tunyankunnan', 'nose_dry', 'kou_jin', 'speech_difficulty', 'kouchibuqing', 'voice_hoarse', 'tongue_blue', 'epistaxis'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：部位｜未归入本组的：呕吐（是吐不是咽部）、口渴、打嗝']
}
