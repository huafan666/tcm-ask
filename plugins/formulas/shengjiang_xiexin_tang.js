module.exports = {
  name: 'shengjiang_xiexin_tang',
  title: '生姜泻心汤',
  kind: 'formula',
  // 第157条: 伤寒汗出解后胃中不和心下痞硬，干噫食臭，胁下有水气，腹中雷鸣下利者，生姜泻心汤主之。
  // 心下痞硬+干噫食臭+腹中雷鸣下利。
  needs: [
    ['epigastric_lump_soft.yes', 'belch_food_smell.yes'],
    ['epigastric_lump_soft.yes', 'borborygmus.yes', 'diarrhea.yes']
  ],
  contraindications: ['心下痞硬+干噫食臭', '胁下水气、腹中雷鸣下利', '和胃消痞散水']
}
