module.exports = {
  name: 'limb_any',
  title: '肢体活动异常',
  kind: 'symptom_group',
  // 症状筛选组（部位）：肢体活动异常
  trigger(text) { return ['手脚', '胳膊', '腿', '肢体', '半身', '站不稳', '走不动'].some(k => text.includes(k)) },
  ask: '是不是手脚有异常——动不了、抬不起、发麻、无力，或者站不稳、走不了？',
  children: ['hemiplegia', 'one_arm_weak', 'limb_numbness', 'limb_heavy_powerless', 'shuangtuiwuli', 'cannot_walk', 'unsteady_stance', 'finger_arm_swelling_tremor', 'bei_fan_zhang', 'joint_swelling', 'joint_red_hot', 'yaguan_tong', 'jiao_qi_pain'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：部位｜未归入本组的：抽筋痉挛（另归 spasm_any）、手足发冷/发热（归感觉类）、关节疼痛']
}
