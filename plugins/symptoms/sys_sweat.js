module.exports = {
  name: 'sys_sweat',
  title: '出汗（有没有、什么时候出）',
  kind: 'symptom_group',
  // 系统闸门（十问歌第 2 问）
  ask: '是不是身上会出汗？',
  children: ['sweat', 'auto_sweat', 'night_sweat', 'cold_sweat', 'head_sweat_only', 'leak_sweat', 'yellow_sweat', 'waist_split_sweat', 'shouhan', 'no_sweat'],
  order: 2,
  isSystem: true,
  rep: 'sweat',
  contraindications: ['【系统闸门】第 2 问（十问歌顺序）：只做「这一个系统有没有问题」的粗筛，不参与证候/方剂推理', '答「没有」⇒ 本系统下所有症状一次性判否，后面永不再问（这是用户要的「排除掉的就不要问了」）', '答「有」⇒ 进入本系统，把里面的子症状一次问清，问完再走下一个系统', '包含的维度分组：sweat_any']
}
