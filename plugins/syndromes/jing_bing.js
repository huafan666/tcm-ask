module.exports = {
  name: 'jing_bing',
  title: '痉病',
  kind: 'summary',
  // 金匮要略·痉湿暍病脉证并治第二 · 病者身热足寒，颈项强急，恶寒，时头热，面赤，目赤，独头动摇，卒口噤，背反张者，痉病也
  needs: [
    ['neck_stiff_pain.yes', 'bei_fan_zhang.yes', 'kou_jin.yes'],
    ['neck_stiff_pain.yes', 'bei_fan_zhang.yes', 'du_tou_dong_yao.yes'],
    ['mian_chi.yes', 'mu_chi.yes', 'cold_extremities.yes']
  ],
  contraindications: ['病机：外邪伤筋、津血不足，筋脉失养而拘急，故项背强急、口噤、背反张、独头动摇', '汗之有无用于分流：表实无汗恶寒=刚痉，表虚汗出而不恶寒=柔痉（两者另建证候）', '痉病忌误汗：若发其汗，寒湿相得，其表益虚，恶寒更甚', '本条原文未出方：痉病有汗者主栝蒌桂枝汤，欲作刚痉者主葛根汤（待后续批次落库）']
}
