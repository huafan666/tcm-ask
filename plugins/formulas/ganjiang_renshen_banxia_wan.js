module.exports = {
  name: 'ganjiang_renshen_banxia_wan',
  title: '干姜人参半夏丸',
  kind: 'formula',
  // 金匮要略·妇人妊娠病脉证并治第二十：妊娠呕吐不止，干姜人参半夏丸主之。
  needs: [
    ['pregnancy.yes', 'pregnancy_vomit.yes'],
    ['pregnancy_vomit.yes', 'cold_aversion.yes']
  ],
  contraindications: ['治妊娠呕吐不止而偏**脾胃虚寒**者', '三味：干姜（温中）、人参（补虚）、半夏（降逆止呕），「姜汁糊丸」', '用时以「生姜汁糊丸，如梧桐子大，饮服十丸，日三服」', '⚠ 半夏是妊娠慎用药（传统认为有堕胎之弊），但原文用了它，取「有故无殒」之义。**必须由医师决定，不可自行服用**', '⚠ 妊娠剧吐（无法进食、脱水、尿酮体阳性）须住院补液，不能只靠口服药']
}
