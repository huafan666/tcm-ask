module.exports = {
  name: 'yin_yang_floating',
  title: '脉阴阳俱浮',
  kind: 'pulse',
  trigger(text) { return ['脉阴阳俱浮', '阴阳俱浮', '两关俱浮'].some(k => text.includes(k)) },
  negate(text) { return ['脉不浮'].some(k => text.includes(k)) }
}
