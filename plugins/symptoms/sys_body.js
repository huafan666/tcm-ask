module.exports = {
  name: 'sys_body',
  title: '身体四肢（酸痛、麻木、乏力、抽筋、消瘦）',
  kind: 'symptom_group',
  // 系统闸门（十问歌第 4 问）
  ask: '身体和手脚有没有不对劲——酸痛发沉、发麻没劲、抽筋，或者人明显变瘦？',
  children: ['body_pain', 'body_ache_stiff', 'joint_pain_rigid', 'joint_pain_severe', 'migratory_pain', 'yaguan_tong', 'zugengtong', 'lower_back_pain', 'joint_red_hot', 'joint_cold_aggravated', 'hemiplegia', 'one_arm_weak', 'limb_numbness', 'limb_heavy_powerless', 'shuangtuiwuli', 'cannot_walk', 'unsteady_stance', 'finger_arm_swelling_tremor', 'bei_fan_zhang', 'joint_swelling', 'jiao_qi_pain', 'yaosuan', 'yaotuisuankun', 'lower_back_cold', 'low_energy', 'tili_cha', 'body_heavy', 'weight_loss', 'tuofa', 'baifa', 'muscle_twitching', 'limb_spasm', 'limb_straight_spasm', 'epileptic_seizure', 'du_tou_dong_yao'],
  order: 4,
  isSystem: true,
  contraindications: ['【系统闸门】第 4 问（十问歌顺序）：只做「这一个系统有没有问题」的粗筛，不参与证候/方剂推理', '答「没有」⇒ 本系统下所有症状一次性判否，后面永不再问（这是用户要的「排除掉的就不要问了」）', '答「有」⇒ 进入本系统，把里面的子症状一次问清，问完再走下一个系统', '包含的维度分组：body_pain_any、limb_any、lowback_any、energy_any、emaciation_any、spasm_any']
}
