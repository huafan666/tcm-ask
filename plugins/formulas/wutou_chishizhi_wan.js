module.exports = {
  name: 'wutou_chishizhi_wan',
  title: '乌头赤石脂丸',
  kind: 'formula',
  // 金匮要略·胸痹心痛短气病脉证并治第九：心痛彻背，背痛彻心，乌头赤石脂丸主之。
  needs: [
    ['heart_pain_radiate.yes'],
    ['heart_pain_radiate.yes', 'cold_extremities.yes']
  ],
  contraindications: ['治阴寒极盛的心痛重证：心痛彻背、背痛彻心，前后穿透，疼得剧烈', '五味：乌头、附子、蜀椒、干姜、赤石脂——四味大辛大热温散阴寒，赤石脂收敛固涩、防辛散太过', '**乌头、附子同用且都有毒**，必须严格按原方炮制（炮）、做成蜜丸小量服（先食服一丸、日三服），绝不能自行加量', '孕妇绝对忌用；服后唇舌发麻立即停药就医', '⚠ 心痛彻背在现代首先要排除急性心梗，务必同时急诊检查，不可只靠中药']
}
