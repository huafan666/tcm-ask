module.exports = {
  name: 'guizhi_qu_shaoyao_jia_fuzi',
  title: '桂枝去芍药加附子汤',
  kind: 'formula',
  // 第22条: 若微寒者，桂枝去芍药加附子汤主之。
  // 暂不做脉，去脉促，用 胸满 + 微寒(阳虚) 主判。
  needs: [
    ['chest_fullness.yes', 'mild_cold.yes']
  ],
  contraindications: ['脉促胸满而兼微寒(阳虚)者用之', '去芍药加附子温经']
}

