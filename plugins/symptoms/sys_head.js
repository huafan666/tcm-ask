module.exports = {
  name: 'sys_head',
  title: '头面（头痛、头晕、眼睛、气色）',
  kind: 'symptom_group',
  // 系统闸门（十问歌第 3 问）
  ask: '头或脸有没有不对劲——头痛、头晕、眼睛不舒服，或者脸色变差？',
  children: ['headache', 'neck_stiff_pain', 'fengchi_tong', 'dizziness', 'unsteady_stance', 'mu_chi', 'eye_bulging', 'eyes_cannot_close', 'eyes_dark_rims', 'tearing_eyes', 'yanjing_duoleishui', 'face_black', 'face_blue', 'face_pale', 'face_yellow', 'face_red_patches', 'face_color_fluctuating', 'mian_chi', 'poor_complexion', 'forehead_dark', 'jaundice', 'er_ming'],
  order: 3,
  isSystem: true,
  contraindications: ['【系统闸门】第 3 问（十问歌顺序）：只做「这一个系统有没有问题」的粗筛，不参与证候/方剂推理', '答「没有」⇒ 本系统下所有症状一次性判否，后面永不再问（这是用户要的「排除掉的就不要问了」）', '答「有」⇒ 进入本系统，把里面的子症状一次问清，问完再走下一个系统', '包含的维度分组：head_pain_any、dizziness_any、eye_any、complexion_any']
}
