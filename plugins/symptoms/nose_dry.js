module.exports = {
  name: 'nose_dry',
  title: '鼻子发干',
  trigger(text) { return ['鼻子发干', '鼻燥', '鼻子干得难受', '鼻腔干燥', '鼻子干得发痒'].some(k => text.includes(k)) },
  negate(text) { return ['鼻子不干'].some(k => text.includes(k)) },
  ask: '是不是鼻子发干、鼻腔里燥得难受？'
}
