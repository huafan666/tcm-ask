module.exports = {
  name: 'yuejingjianshao',
  title: '月经减少',
  trigger(text) { return ['月经量变少', '月经量不多', '月经减少'].some(k => text.includes(k)) },
  ask: '是不是月经量比以前明显变少？'
}
