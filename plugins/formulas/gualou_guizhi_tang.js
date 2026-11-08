module.exports = {
  name: 'gualou_guizhi_tang',
  title: '栝蒌桂枝汤',
  kind: 'formula',
  // 金匮要略·痉湿暍病脉证并治第二：太阳病，其证备，身体强，几几然，脉反沉迟，此为痉，栝蒌桂枝汤主之。
  needs: ['sweat.yes', 'neck_stiff_pain.yes', 'cold_aversion.no'],
  contraindications: ['柔痉主方：汗出、身体强几几而脉沉迟（桂枝汤加栝蒌根，解肌生津、舒缓筋脉）', '与葛根汤区别在有无汗出：无汗而欲作刚痉者用葛根汤，汗出者用本方', '条文本有脉反沉迟，脉象暂不入判定（本项目约定）', '取微汗，不可大汗；痉病误汗则表益虚、恶寒更甚']
}
