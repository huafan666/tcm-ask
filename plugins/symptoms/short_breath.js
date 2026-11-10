module.exports = {
  name: 'short_breath',
  title: '短气',
  trigger(text) { return ['短气', '气短', '气不够用', '呼吸跟不上', '气接不上'].some(k => text.includes(k)) },
  negate(text) { return ['不气短', '呼吸顺畅'].some(k => text.includes(k)) },
  ask: '是不是觉得气不够用、呼吸跟不上，但又不算真正喘？'
}
