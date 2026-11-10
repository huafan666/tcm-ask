module.exports = {
  name: 'sys_gyneco',
  title: '妇科/生殖',
  kind: 'symptom_group',
  // 系统闸门（十问歌第 13 问）
  ask: '月经、白带或下阴生殖方面有没有异常？（不相关就说没有）',
  children: ['amenorrhea', 'yuejingjianshao', 'vaginal_bleeding', 'vaginal_discharge', 'vulvar_cold', 'yin_chui', 'buyun', 'genital_cold', 'genital_ulcer', 'semen_loss', 'dream_sex', 'testicle_alternating_swelling', 'jingzixishao', 'lochia_retention', 'tongjing', 'anal_ulcer', 'blood_clot_dark', 'pregnancy', 'postpartum'],
  order: 13,
  isSystem: true,
  contraindications: ['【系统闸门】第 13 问（十问歌顺序）：只做「这一个系统有没有问题」的粗筛，不参与证候/方剂推理', '答「没有」⇒ 本系统下所有症状一次性判否，后面永不再问（这是用户要的「排除掉的就不要问了」）', '答「有」⇒ 进入本系统，把里面的子症状一次问清，问完再走下一个系统', '包含的维度分组：gyneco_any、reproductive_state_any']
}
