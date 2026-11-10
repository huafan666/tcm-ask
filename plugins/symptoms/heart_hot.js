module.exports = {
  name: 'heart_hot',
  title: '心里发热',
  trigger(text) { return ['心里发热', '心中热', '心里热烘烘的', '心里火烧火燎', '心口里面发热'].some(k => text.includes(k)) },
  negate(text) { return ['心里不热'].some(k => text.includes(k)) },
  ask: '是不是心里（胸口里面）觉得发热、热烘烘的？'
}
