module.exports = {
  name: 'tongue_blue',
  title: '舌头颜色青紫',
  trigger(text) { return ['舌头颜色青紫', '舌质青紫', '舌青', '舌头紫暗', '舌头颜色发紫', '舌头上有紫斑'].some(k => text.includes(k)) },
  negate(text) { return ['舌色正常'].some(k => text.includes(k)) },
  ask: '是不是舌头颜色发青、发紫，或者有紫斑？'
}
