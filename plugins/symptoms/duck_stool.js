module.exports = {
  name: 'duck_stool',
  title: '大便稀溏像鸭粪',
  trigger(text) { return ['大便像鸭粪', '鸭溏', '拉稀水粪混杂', '大便稀而不爽', '大便溏薄水样', '拉的像鸭屎'].some(k => text.includes(k)) },
  negate(text) { return ['大便成形'].some(k => text.includes(k)) },
  ask: '是不是大便稀溏、水和粪混在一起，像鸭粪那样？'
}
