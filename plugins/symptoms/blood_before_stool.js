module.exports = {
  name: 'blood_before_stool',
  title: '先出血后大便（近血）',
  trigger(text) { return ['先出血后大便', '先血后便', '先流血再拉大便', '血在便的前面', '一蹲下先流血'].some(k => text.includes(k)) },
  negate(text) { return ['不是便前出血'].some(k => text.includes(k)) },
  ask: '是不是先出血，然后才拉出大便（原文叫「近血」）？'
}
