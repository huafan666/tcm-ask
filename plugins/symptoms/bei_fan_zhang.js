module.exports = {
  name: 'bei_fan_zhang',
  title: '背反张',
  trigger(text) { return ['背反张', '角弓反张', '项背反张', '身子往后反弓', '后背反张', '往后弓', '腰背反张', '身子往后仰'].some(k => text.includes(k)) },
  negate(text) { return ['背不反张', '身子能弯'].some(k => text.includes(k)) },
  ask: '是不是后背和脖子僵得整个人往后弓，像拉开的弓一样？'
}
