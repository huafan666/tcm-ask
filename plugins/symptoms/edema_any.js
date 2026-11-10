module.exports = {
  name: 'edema_any',
  title: '水肿（身上肿起来）',
  kind: 'symptom_group',
  // 症状筛选组（物质）：水肿（身上肿起来）
  trigger(text) { return ['肿', '浮肿', '水肿', '肿起', '发肿'].some(k => text.includes(k)) },
  ask: '是不是身上有肿——脸、眼睛、手脚或者下身肿起来？',
  children: ['pitting_edema', 'mild_edema', 'eyelid_puffy', 'foot_swelling_drop', 'scrotal_edema'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：物质｜未归入本组的：肿块/包块（那是长东西不是水肿）、关节肿大（是关节不是水肿）']
}
