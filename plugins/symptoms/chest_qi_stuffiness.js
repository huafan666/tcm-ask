module.exports = {
  name: 'chest_qi_stuffiness',
  title: '胸中气塞',
  trigger(text) { return ['胸中气塞', '胸口发塞', '胸中闷塞', '气塞胸口', '胸口塞得慌', '胸里堵着一股气', '胸口像塞了东西'].some(k => text.includes(k)) },
  negate(text) { return ['胸口不塞'].some(k => text.includes(k)) },
  ask: '是不是胸口像塞着一团气、闷得不通气？'
}
