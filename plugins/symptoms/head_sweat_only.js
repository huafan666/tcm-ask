module.exports = {
  name: 'head_sweat_only',
  title: '只有头上出汗',
  trigger(text) { return ['只有头上出汗', '但头汗出', '光头上冒汗', '身上不出汗就头部出汗', '头上一直冒汗', '汗只在头上'].some(k => text.includes(k)) },
  negate(text) { return ['全身都出汗'].some(k => text.includes(k)) },
  ask: '是不是只有头上出汗，身上其他地方不出汗？'
}
