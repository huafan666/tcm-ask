module.exports = {
  name: 'yaosuanruan',
  title: '腰酸软',
  trigger(text) { return ['腰酸', '腰软', '腰没力气'].some(k => text.includes(k)) },
  ask: '是不是腰软，腰没力气'
}
