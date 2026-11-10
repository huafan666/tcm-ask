module.exports = {
  name: 'body_aches_heavy',
  title: '身疼重',
  trigger(text) { return ['身疼重', '身体疼重', '又疼又沉', '疼而且沉'].some(k => text.includes(k)) },
  negate(text) { return ['不疼', '不沉'].some(k => text.includes(k)) },
  ask: '是不是身上又疼又沉重，像被水浸着一样？'
}
