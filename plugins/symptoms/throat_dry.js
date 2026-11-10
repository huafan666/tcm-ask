module.exports = {
  name: 'throat_dry',
  title: '嗓子发干',
  trigger(text) { return ['嗓子发干', '喉咙发干', '咽干', '嗓子干', '喉咙干燥', '嗓子眼干', '嗓子干得慌', '喉咙干得难受', '嗓子干得难受'].some(k => text.includes(k)) },
  negate(text) { return ['嗓子不干', '喉咙不干'].some(k => text.includes(k)) },
  ask: '是不是嗓子发干、发涩，喝水也润不过来？'
}
