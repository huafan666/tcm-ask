module.exports = {
  name: 'amenorrhea',
  title: '月经不来',
  trigger(text) { return ['月经不来', '经水闭', '闭经', '好几个月没来月经', '月经停了不来', '月经闭止'].some(k => text.includes(k)) },
  negate(text) { return ['月经正常来'].some(k => text.includes(k)) },
  ask: '是不是月经不来（闭经）？'
}
