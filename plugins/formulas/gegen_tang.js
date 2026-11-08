module.exports = {
  name: 'gegen_tang',
  title: '葛根汤',
  kind: 'formula',
  // 第31条: 项背强几几无汗恶风者主之(表实无汗)。
  // 第32条: 太阳与阳明合病必自下利也主之。
  needs: [
    // 31条: 项背强+无汗
    ['neck_stiff_pain.yes', 'no_sweat.yes', 'severe_thirst.no'],
    ['neck_stiff_pain.yes', 'no_sweat.yes', 'wind_aversion.yes', 'severe_thirst.no'],
    // 32条: 太阳阳明合病下利(须有表证无汗)
    ['diarrhea.yes', 'no_sweat.yes'],
    // 金匮2.12: 欲作刚痉(无汗+口噤不得语+气上冲胸)
    ['no_sweat.yes', 'kou_jin.yes', 'qi_surge.yes']
  ],
  contraindications: ['表实无汗而项背强者主之', '太阳阳明合病下利亦主之', '与桂枝加葛根区别在有无汗出', '服药取微汗', '金匮要略·痉湿暍病脉证并治第二：太阳病无汗而小便反少，气上冲胸，口噤不得语，欲作刚痉，葛根汤主之']
}

