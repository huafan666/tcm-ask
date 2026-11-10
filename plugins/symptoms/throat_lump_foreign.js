module.exports = {
  name: 'throat_lump_foreign',
  title: '嗓子里像有块肉堵着',
  trigger(text) { return ['嗓子里像有块肉堵着', '咽中如有炙脔', '喉咙里有东西堵着吞不下吐不出', '嗓子里有异物感', '喉咙像有块肉', '咽不下吐不出', '嗓子眼堵着个东西'].some(k => text.includes(k)) },
  negate(text) { return ['嗓子没有异物感'].some(k => text.includes(k)) },
  ask: '是不是嗓子里好像有块肉堵着，咳不出来也咽不下去？'
}
