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
    ['diarrhea.yes', 'no_sweat.yes']
  ],
  contraindications: ['表实无汗而项背强者主之', '太阳阳明合病下利亦主之', '与桂枝加葛根区别在有无汗出', '服药取微汗']
}

