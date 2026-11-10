module.exports = {
  name: 'sys_urine',
  title: '小便',
  kind: 'symptom_group',
  // 系统闸门（十问歌第 8 问）
  ask: '小便有没有不对劲——次数多、尿不出、颜色很深，或者带血？',
  children: ['urination_difficulty', 'easy_urination', 'frequent_urination', 'dark_urine', 'urine_incontinence', 'urine_gravel', 'polyuria', 'hematuria', 'xiaobian_dilou', 'xiaobian_fuli'],
  order: 8,
  isSystem: true,
  contraindications: ['【系统闸门】第 8 问（十问歌顺序）：只做「这一个系统有没有问题」的粗筛，不参与证候/方剂推理', '答「没有」⇒ 本系统下所有症状一次性判否，后面永不再问（这是用户要的「排除掉的就不要问了」）', '答「有」⇒ 进入本系统，把里面的子症状一次问清，问完再走下一个系统', '包含的维度分组：urination_any']
}
