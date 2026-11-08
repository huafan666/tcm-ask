module.exports = {
  name: 'xiaobian_dilou',
  title: '小便滴漏',
  trigger(text) { return ['小便滴漏', '小便一滴一滴的', '小便漏'].some(k => text.includes(k)) },
  ask: '是不是小便不痛快，一滴一滴地漏，或者自己漏尿？'
}
