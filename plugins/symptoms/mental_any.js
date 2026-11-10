module.exports = {
  name: 'mental_any',
  title: '神志情绪异常',
  kind: 'symptom_group',
  // 症状筛选组（状态）：神志情绪异常
  trigger(text) { return ['烦', '躁', '谵语', '发狂', '胡话', '悲伤', '哭泣'].some(k => text.includes(k)) },
  ask: '是不是神志或情绪不对——说胡话、烦躁发狂、自言自语、或者莫名悲伤？',
  children: ['delirium', 'manic', 'self_talk_ceaseless', 'aimless_walking', 'mute_quiet', 'day_agitated_night_calm', 'restless', 'sad_cry_easily', 'frequent_yawning'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：状态｜未归入本组的：失眠（睡眠类）、头晕、心悸']
}
