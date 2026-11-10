module.exports = {
  name: 'sys_resp',
  title: '呼吸咽喉（咳嗽、气喘、咽）',
  kind: 'symptom_group',
  // 系统闸门（十问歌第 8 问）
  ask: '呼吸和嗓子怎么样——咳嗽、气喘、痰多、咽痛咽干、喉咙堵？',
  children: ['cough', 'qi_upward_cough', 'chuan', 'short_breath', 'orthopnea', 'throat_pain', 'throat_dry', 'throat_ulcer', 'throat_lump_foreign', 'houlongjinsuo', 'tunyankunnan', 'nose_dry', 'kou_jin', 'speech_difficulty', 'kouchibuqing', 'voice_hoarse', 'tongue_blue'],
  order: 8,
  isSystem: true,
  contraindications: ['【系统闸门】第 8 问（十问歌顺序）：只做「这一个系统有没有问题」的粗筛，不参与证候/方剂推理', '答「没有」⇒ 本系统下所有症状一次性判否，后面永不再问（这是用户要的「排除掉的就不要问了」）', '答「有」⇒ 进入本系统，把里面的子症状一次问清，问完再走下一个系统', '包含的维度分组：cough_any、dyspnea_any、mouth_throat_any']
}
