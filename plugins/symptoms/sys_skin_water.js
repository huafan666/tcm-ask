module.exports = {
  name: 'sys_skin_water',
  title: '皮肤与水肿',
  kind: 'symptom_group',
  // 系统闸门（十问歌第 12 问）
  ask: '皮肤或身上有没有肿——痒、起疹、干燥，或者脸、手脚肿起来？',
  children: ['skin_itch_hives', 'skin_scaly', 'skin_yang', 'oozing_skin', 'spreading_skin_sore', 'guoming_hongzhong', 'wound_injury', 'pitting_edema', 'mild_edema', 'eyelid_puffy', 'foot_swelling_drop', 'scrotal_edema', 'wocanminxian'],
  order: 12,
  isSystem: true,
  contraindications: ['【系统闸门】第 12 问（十问歌顺序）：只做「这一个系统有没有问题」的粗筛，不参与证候/方剂推理', '答「没有」⇒ 本系统下所有症状一次性判否，后面永不再问（这是用户要的「排除掉的就不要问了」）', '答「有」⇒ 进入本系统，把里面的子症状一次问清，问完再走下一个系统', '包含的维度分组：skin_any、edema_any']
}
