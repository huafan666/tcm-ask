module.exports = {
  name: 'sleep_any',
  title: '睡眠异常',
  kind: 'symptom_group',
  trigger(text) { return ['睡眠', '睡不好', '睡不着', '失眠', '不寐', '多梦', '嗜睡', '老想睡', '入睡', '睡不实', '容易醒'].some(k => text.includes(k)) },
  ask: '是不是睡觉有问题——睡不着、老想睡、多梦或者睡不好？',
  children: ['shuimianbuhao', 'insomnia_onset', 'frequent_waking', 'light_sleep', 'vex_insomnia', 'sleepy', 'duomeng', 'restless_lying', 'dahan'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：状态｜本组的作用就是**必须在睡眠问题上先粗筛**：先确认「睡觉有没有问题」，再细化到入睡困难/易醒/睡眠浅/多梦/虚烦', '另外不收：烦躁（那是情绪）、昏睡不醒（神志问题）、打鼾（呼吸）']
}
