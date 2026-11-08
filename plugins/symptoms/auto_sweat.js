module.exports = {
  name: 'auto_sweat',
  title: '自汗出',
  kind: 'symptom',
  trigger(text) { return ['自汗', '自动出汗', '不动也出汗', '坐着也出汗', '自己就出汗', '自己出汗', '没动也冒汗', '安静也出汗'].some(k => text.includes(k)) },
  negate(text) { return ['不自行出汗'].some(k => text.includes(k)) },
  ask: '是不是没运动、安静待着也自己冒汗，一动就更明显？'
}

