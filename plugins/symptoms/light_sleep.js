module.exports = {
  name: 'light_sleep',
  title: '睡眠浅',
  trigger(text) { return ['睡眠浅', '睡得浅', '睡不实', '睡得不沉', '一有动静就醒', '睡得很轻', '睡眠比较浅', '睡得很浅', '一点动静就醒', '睡不踏实', '稍微有点声音就醒', '浅眠'].some(k => text.includes(k)) },
  negate(text) { return ['睡得很沉'].some(k => text.includes(k)) },
  ask: '是不是睡得很浅，一点动静就醒、睡不踏实？'
}
