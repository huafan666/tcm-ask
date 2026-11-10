module.exports = {
  name: 'cold_sweat',
  title: '出冷汗',
  trigger(text) { return ['出冷汗', '白汗出', '疼得冒冷汗', '一阵冷汗', '冷汗直冒', '身上发凉还出汗', '冒冷汗', '一身冷汗', '冷汗', '疼得一身汗发凉'].some(k => text.includes(k)) },
  negate(text) { return ['不出冷汗'].some(k => text.includes(k)) },
  ask: '是不是疼起来会出一身冷汗，身上还是凉的？'
}
