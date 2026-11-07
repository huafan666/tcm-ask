module.exports = {
  name: 'day_agitated_night_calm',
  title: '昼烦夜静',
  kind: 'symptom',
  trigger(text) { return ['昼日烦躁', '白天烦躁', '白天烦晚上安', '日煩夜靜', '昼烦夜静', '白天烦躁晚上安静'].some(k => text.includes(k)) },
  negate(text) { return ['夜不静', '昼夜都烦'].some(k => text.includes(k)) }
}

