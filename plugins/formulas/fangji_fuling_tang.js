module.exports = {
  name: 'fangji_fuling_tang',
  title: '防己茯苓汤',
  kind: 'formula',
  // 金匮要略·水气病脉证并治第十四：皮水为病，四肢肿，水气在皮肤中，四肢聂聂动者，防己茯苓汤主之。
  needs: [
    ['pitting_edema.yes', 'muscle_twitching.yes'],
    ['pitting_edema.yes', 'limb_heavy_powerless.yes']
  ],
  contraindications: ['治皮水：四肢浮肿，水气在皮肤中，还伴**四肢聂聂动**（肌肉轻微跳动）', '「聂聂动」是水气在皮中、阳气被郁的表现，是本方最特异的指征', '防己、黄芪、桂枝、茯苓、甘草——通阳化气、利水消肿', '和防己黄芪汤区别：防己黄芪汤是风水表虚汗出，本方是皮水四肢肿而水在皮中']
}
