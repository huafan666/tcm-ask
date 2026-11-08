module.exports = {
  name: 'xiazhui',
  title: '下坠',
  trigger(text) { return ['下坠痛', '下坠感'].some(k => text.includes(k)) },
  ask: '是不是感觉肚子、肛门或下面有往下坠的感觉？'
}
