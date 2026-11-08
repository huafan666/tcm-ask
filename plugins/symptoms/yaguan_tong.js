module.exports = {
  name: 'yaguan_tong',
  title: '牙关痛',
  trigger(text) { return ['牙痛'].some(k => text.includes(k)) },
  ask: '是不是牙关（腮帮子两边）会痛？'
}
