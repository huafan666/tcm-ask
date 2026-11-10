module.exports = {
  name: 'body_heavy',
  title: '身重',
  kind: 'symptom',
  trigger(text) { return ['身重', '身体沉重', '身子沉', '乏力身重', '身上发沉', '浑身发沉', '身子发沉', '腿发沉', '觉得沉', '身上沉重', '浑身沉重', '身子沉重'].some(k => text.includes(k)) },
  negate(text) { return ['身轻', '不沉重'].some(k => text.includes(k)) },
  ask: '是不是觉得身体特别沉、发懒，像背着东西一样？'
}
