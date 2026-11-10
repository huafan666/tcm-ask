module.exports = {
  name: 'kuizi_fuling_san',
  title: '葵子茯苓散',
  kind: 'formula',
  // 金匮要略·妇人妊娠病脉证并治第二十：妊娠有水气，身重，小便不利，洒淅恶寒，起即头眩，葵子茯苓散主之。
  needs: [
    ['pregnancy.yes', 'body_heavy.yes', 'urination_difficulty.yes'],
    ['pregnancy.yes', 'pitting_edema.yes', 'dizziness.yes']
  ],
  contraindications: ['治妊娠水气：身体沉重、小便不利、一阵阵怕冷、一起来就头晕', '只有两味：葵子（冬葵子，滑利通小便）、茯苓（利水健脾），「杵为散，饮服方寸匕，日三服」', '原文说「小便利则愈」——小便一通，水湿有出路就好了', '病机是妊娠期水湿内停、气化不利', '⚠ 妊娠水肿伴高血压、蛋白尿要警惕**妊娠期高血压疾病**，必须产科就诊']
}
