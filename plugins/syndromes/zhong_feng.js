module.exports = {
  name: 'zhong_feng',
  title: '中风',
  kind: 'summary',
  // 金匮要略·中风历节病脉证并治第五：夫风之为病，当半身不遂，或但臂不遂者，此为痹……邪在于络，肌肤不仁；邪在于经，即重不胜。
  needs: [
    ['hemiplegia.yes'],
    ['hemiplegia.yes', 'limb_numbness.yes'],
    ['hemiplegia.yes', 'limb_heavy_powerless.yes'],
    ['one_arm_weak.yes', 'limb_numbness.yes']
  ],
  contraindications: ['中风的标志是「半身不遂」——半边身子不能动；如果只是单侧胳膊不能动，原文说这偏「痹」，程度轻', '原文按邪气深浅分层次：在络（肌肤麻木不仁）→ 在经（肢体沉重抬不动）→ 入腑（神志昏糊不识人）→ 入脏（舌硬说不出话）', '「喎僻不遂」指口眼歪斜（嘴和眼睛歪向一侧），是常见伴随表现', '病因是正气先虚（络脉空虚），外邪才乘虚而入，不是单纯「受风」']
}
