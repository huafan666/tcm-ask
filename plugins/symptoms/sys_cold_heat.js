module.exports = {
  name: 'sys_cold_heat',
  title: '寒热（怕冷、发热）',
  kind: 'symptom_group',
  // 系统闸门（十问歌第 1 问）
  ask: '是不是有怕冷、发热，或者一阵冷一阵热？',
  children: ['cold_aversion', 'wind_aversion', 'mild_cold', 'back_cold_patch', 'genital_cold', 'lower_back_cold', 'lower_leg_cold', 'xigaiyixialeng', 'lower_abdomen_cold_fan', 'heart_cold_weak', 'chill_predominant', 'cold_extremities', 'joint_cold_aggravated', 'fever', 'tidal_fever', 'alternating_cold_heat', 'zijue_shenre', 'burning', 'heat_only_no_chill', 'periodic_chill_fever', 'hand_foot_hot', 'shuangzu_re', 'heart_hot', 'pseudo_cold_heat'],
  order: 1,
  isSystem: true,
  contraindications: ['【系统闸门】第 1 问（十问歌顺序）：只做「这一个系统有没有问题」的粗筛，不参与证候/方剂推理', '答「没有」⇒ 本系统下所有症状一次性判否，后面永不再问（这是用户要的「排除掉的就不要问了」）', '答「有」⇒ 进入本系统，把里面的子症状一次问清，问完再走下一个系统', '包含的维度分组：cold_any、fever_any']
}
