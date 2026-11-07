module.exports = {
  name: 'gancao_tang',
  title: '甘草汤',
  kind: 'formula',
  // 第311条: 少阴病二三日咽痛者可与甘草汤;不差者与桔梗汤。
  // 单纯咽痛(轻证)无下利。与猪肤区别(彼下利心烦)、与桔梗区别(彼重)。
  needs: [
    ['throat_pain.yes', 'diarrhea.no']
  ],
  contraindications: ['单纯咽痛(轻证,无下利)', '清热利咽(甘草),不差者换桔梗汤', '咽痛兼下利用猪肤']
}
