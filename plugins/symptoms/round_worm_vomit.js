module.exports = {
  name: 'round_worm_vomit',
  title: '吐蛔虫',
  kind: 'symptom',
  trigger(text) { return ['吐虫', '吐蛔', '吐蛔虫', '吐出蛔虫', '吐蛔出', '大便出虫'].some(k => text.includes(k)) },
  negate(text) { return ['没吐虫', '无虫'].some(k => text.includes(k)) },
  ask: '有没有吐出/拉出蛔虫？吐蛔(蚘厥)+时烦是乌梅丸证。'
}
