module.exports = {
  name: 'rufangzhongkuai',
  title: '乳房肿块',
  trigger(text) { return ['乳房肿块', '乳癌', '乳腺结节'].some(k => text.includes(k)) },
  ask: '是不是乳房里摸到肿块、结节？'
}
