module.exports = {
  name: 'heart_cold_weak',
  title: '心里发冷、觉得虚',
  trigger(text) { return ['心里发冷', '心里觉得冷', '心中恶寒', '心里虚得慌', '心里空落落地发冷', '胸口里面发冷'].some(k => text.includes(k)) },
  negate(text) { return ['心里不冷'].some(k => text.includes(k)) },
  ask: '是不是心里（胸口里面）觉得发冷、发虚，没底气？'
}
