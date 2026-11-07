module.exports = {
  name: 'yuejingjianshao',
  title: '月经减少',
  trigger(text) { return ['月经量变少', '月经量不多', '月经减少'].some(k => text.includes(k)) },
  ask: '月经量是不是没有之前多，量变少了'
}
