module.exports = {
  name: 'mahuang_tang',
  title: '麻黄汤',
  kind: 'formula',
  // 第35条: 太阳病头痛发热身疼腰痛骨节疼痛恶风无汗而喘者，麻黄汤主之。
  // 核心=无汗+恶风(表实)，身疼骨节痛/喘为伴随。发热可微。脉浮紧不做。
  needs: [
    ['no_sweat.yes', 'wind_aversion.yes', 'severe_thirst.no'],
    ['no_sweat.yes', 'wind_aversion.yes', 'chuan.yes', 'severe_thirst.no'],
    ['no_sweat.yes', 'cold_aversion.yes', 'severe_thirst.no']
  ],
  contraindications: ['表实无汗而喘者主之', '无汗(表实)者用之，汗出者忌', '桂枝汤证(表虚有汗)禁', '服药取微汗，不须啜粥']
}

