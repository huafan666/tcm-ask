module.exports = {
  name: 'sys_bowel',
  title: '大便',
  kind: 'symptom_group',
  // 系统闸门（十问歌第 7 问）
  ask: '大便有没有不对劲——干硬、稀溏、次数多、带血，还是发黑？',
  children: ['diarrhea', 'chronic_diarrhea', 'clear_grain_diarrhea', 'duck_stool', 'qi_li', 'constipation', 'qingdubianmi', 'stool_blood', 'black_stool', 'blood_after_stool', 'blood_before_stool', 'blood_pus_stool', 'tenesmus'],
  order: 7,
  isSystem: true,
  contraindications: ['【系统闸门】第 7 问（十问歌顺序）：只做「这一个系统有没有问题」的粗筛，不参与证候/方剂推理', '答「没有」⇒ 本系统下所有症状一次性判否，后面永不再问（这是用户要的「排除掉的就不要问了」）', '答「有」⇒ 进入本系统，把里面的子症状一次问清，问完再走下一个系统', '包含的维度分组：stool_any、diarrhea_any']
}
