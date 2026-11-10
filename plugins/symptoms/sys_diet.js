module.exports = {
  name: 'sys_diet',
  title: '饮食（胃口、口渴、口味）',
  kind: 'symptom_group',
  // 系统闸门（十问歌第 4 问）
  ask: '吃喝怎么样——胃口好不好？渴不渴、想喝热的还是凉的？嘴里发苦、发酸还是有异味？',
  children: ['low_appetite', 'hungry', 'polyphagia', 'appetite_fluctuating', 'thirsty', 'severe_thirst', 'bitter_taste', 'wei_suan', 'thirst_rinse_only', 'cold_drink_desire'],
  order: 4,
  isSystem: true,
  contraindications: ['【系统闸门】第 4 问（十问歌顺序）：只做「这一个系统有没有问题」的粗筛，不参与证候/方剂推理', '答「没有」⇒ 本系统下所有症状一次性判否，后面永不再问（这是用户要的「排除掉的就不要问了」）', '答「有」⇒ 进入本系统，把里面的子症状一次问清，问完再走下一个系统', '包含的维度分组：appetite_any、thirst_any、taste_any']
}
