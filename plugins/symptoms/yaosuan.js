module.exports = {
  name: 'yaosuan',
  title: '腰酸',
  trigger(text) { return ['腰酸', '腰酸痛', '腰痛', '腰软', '腰发软', '腰没力气'].some(k => text.includes(k)) },
  ask: '是不是腰又酸又软、没什么力气，而不是胀痛、刺痛？'
}
