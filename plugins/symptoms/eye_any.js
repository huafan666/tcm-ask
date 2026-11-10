module.exports = {
  name: 'eye_any',
  title: '眼睛异常',
  kind: 'symptom_group',
  // 症状筛选组（部位）：眼睛异常
  trigger(text) { return ['眼', '目'].some(k => text.includes(k)) },
  ask: '是不是眼睛有不舒服或异常——红、胀、闭合不全、发黑或者流泪？',
  children: ['mu_chi', 'eye_bulging', 'eyes_cannot_close', 'eyes_dark_rims', 'tearing_eyes', 'yanjing_duoleishui'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：部位｜未归入本组的：视力模糊、眼睑浮肿（那是水肿类）、眼白发黄（属面色/黄疸）']
}
