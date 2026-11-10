module.exports = {
  name: 'guizhi_gancao_tang',
  title: '桂枝甘草汤',
  kind: 'formula',
  // 第64条: 发汗过多，其人叉手自冒心，心下悸欲得按者，桂枝甘草汤主之。
  needs: ['heart_palp.yes', 'desire_to_press_chest.yes'],
  contraindications: ['发汗过多心阳虚、心下悸', '叉手按心欲得按', '补心阳益卫']
}

