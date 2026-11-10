module.exports = {
  name: 'sys_chest_abdomen',
  title: '胸腹（胸闷、腹痛、呕吐）',
  kind: 'symptom_group',
  // 系统闸门（十问歌第 6 问）
  ask: '胸口或肚子有没有不对劲——胀、痛、恶心想吐、心慌、打嗝？',
  children: ['hypochondriac_fullness', 'hypochondriac_mass', 'hypochondriac_rush', 'hypochondriac_side_pain', 'zuolei_tong', 'left_leigu_suan', 'chest_fullness', 'chest_qi_stuffiness', 'chest_stuffy', 'chest_lump_hard', 'chest_indescribable', 'desire_to_press_chest', 'chest_back_pain', 'heart_bind_pain', 'heart_hanging_pain', 'heart_pain_radiate', 'danjieshidianyatong', 'abdominal_fullness', 'abdominal_pain', 'abdominal_tension', 'abdominal_cramp_after_birth', 'circumumbilical_pain', 'duzijiaotonghuocitong', 'severe_abdominal_pain', 'fubulentong', 'lower_abdomen_cramp', 'lower_abdomen_swelling_pain', 'lower_abdominal_lump', 'epigastric_fullness', 'epigastric_lump_soft', 'epigastric_mass_plate', 'epigastric_pressing_pain', 'press_only_pain', 'press_pain_aggravated', 'full_epigastric_hard_pain', 'abdomen_bulging_mass', 'left_abdomen_press_pain', 'borborygmus', 'flatus', 'chongji', 'wei_tong', 'heart_palp', 'below_palp', 'ben_tun', 'vomiting', 'vomit_saliva', 'vomit_on_food', 'vomit_on_intake', 'vomit_right_after_eating', 'food_vomit_delayed', 'water_reflux', 'hematemesis', 'tu_nongxue', 'round_worm_vomit', 'saliva_spit', 'pregnancy_vomit', 'vex_like_vomit', 'saliva_heart_pain_paroxysmal', 'belching', 'belch_food_smell', 'hiccup', 'fixed_mass', 'rufangzhongkuai', 'gaihua_zhongkuai', 'nausea', 'qi_surge', 'xiazhui'],
  order: 6,
  isSystem: true,
  contraindications: ['【系统闸门】第 6 问（十问歌顺序）：只做「这一个系统有没有问题」的粗筛，不参与证候/方剂推理', '答「没有」⇒ 本系统下所有症状一次性判否，后面永不再问（这是用户要的「排除掉的就不要问了」）', '答「有」⇒ 进入本系统，把里面的子症状一次问清，问完再走下一个系统', '包含的维度分组：hypochondrium_any、abdomen_any、palpitation_any、vomit_any、belch_any、mass_any']
}
