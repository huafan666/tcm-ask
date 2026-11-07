module.exports = {
  name: 'guizhi_renshen_tang',
  title: '桂枝人参汤',
  kind: 'formula',
  // 第163条: 太阳病外证未除而数下之遂协热利，利下不止心下痞硬表里不解者，桂枝人参汤主之。
  // 协热下利+心下痞硬。核心=下利+心下痞。
  needs: [
    ['diarrhea.yes', 'epigastric_lump_soft.yes']
  ],
  contraindications: ['协热下利+心下痞硬', '表里不解', '温中解表']
}
