module.exports = {
  name: 'postpartum',
  title: '刚生完孩子',
  trigger(text) { return ['刚生完孩子', '刚生产完', '产后', '坐月子', '新产后', '分娩后不久', '刚分娩完'].some(k => text.includes(k)) },
  negate(text) { return ['不是产后'].some(k => text.includes(k)) },
  ask: '是不是刚生完孩子不久（产后）？'
}
