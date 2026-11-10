module.exports = {
  name: 'sys_mental',
  title: '情绪神志',
  kind: 'symptom_group',
  // 系统闸门（十问歌第 11 问）
  ask: '情绪或神志有没有不对劲——烦躁坐不住、想哭，或者说胡话发狂？',
  children: ['delirium', 'manic', 'self_talk_ceaseless', 'aimless_walking', 'mute_quiet', 'day_agitated_night_calm', 'restless', 'sad_cry_easily', 'frequent_yawning'],
  order: 11,
  isSystem: true,
  contraindications: ['【系统闸门】第 11 问（十问歌顺序）：只做「这一个系统有没有问题」的粗筛，不参与证候/方剂推理', '答「没有」⇒ 本系统下所有症状一次性判否，后面永不再问（这是用户要的「排除掉的就不要问了」）', '答「有」⇒ 进入本系统，把里面的子症状一次问清，问完再走下一个系统', '包含的维度分组：mental_any']
}
