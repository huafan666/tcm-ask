module.exports = {
  name: 'yaosuan',
  title: '腰酸',
  trigger(text) { return ['腰酸', '腰酸痛', '腰痛'].some(k => text.includes(k)) },
  ask: '是不是腰酸痛，而不是胀痛或者其它'
}
