module.exports = {
  name: 'sys_sleep',
  title: '睡眠',
  kind: 'symptom_group',
  // 系统闸门（十问歌第 9 问）
  ask: '睡觉怎么样——躺下好久睡不着、睡着了容易醒、睡得浅、多梦，还是白天老想睡？',
  children: ['shuimianbuhao', 'insomnia_onset', 'frequent_waking', 'light_sleep', 'vex_insomnia', 'sleepy', 'duomeng', 'restless_lying', 'dahan'],
  order: 9,
  isSystem: true,
  contraindications: ['【系统闸门】第 9 问（十问歌顺序）：只做「这一个系统有没有问题」的粗筛，不参与证候/方剂推理', '答「没有」⇒ 本系统下所有症状一次性判否，后面永不再问（这是用户要的「排除掉的就不要问了」）', '答「有」⇒ 进入本系统，把里面的子症状一次问清，问完再走下一个系统', '包含的维度分组：sleep_any']
}
