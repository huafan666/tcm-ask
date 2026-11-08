module.exports = {
  name: 'tongjing',
  title: '痛经',
  trigger(text) { return ['痛经'].some(k => text.includes(k)) },
  ask: '是不是来月经时会痛经？'
}
