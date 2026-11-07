module.exports = {
  name: 'tili_cha',
  title: '体力很差',
  trigger(text) { return ['体力差', '没力气', '没劲', '不想动'].some(k => text.includes(k)) },
  ask: '是不是平时体力很差，动一下就累'
}
