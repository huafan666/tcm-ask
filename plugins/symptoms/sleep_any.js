module.exports = {
  name: 'sleep_any',
  title: '睡眠异常',
  kind: 'symptom_group',
  // 症状筛选组（状态）：睡眠异常
  trigger(text) { return ['睡', '失眠', '不眠', '眠', '多梦'].some(k => text.includes(k)) },
  ask: '是不是睡觉有问题——睡不着、老想睡、多梦或者睡不好？',
  children: ['shuimianbuhao', 'vex_insomnia', 'sleepy', 'duomeng', 'restless_lying', 'dahan'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：状态｜未归入本组的：烦躁（那是情绪）、昏睡不醒（神志问题）']
}
