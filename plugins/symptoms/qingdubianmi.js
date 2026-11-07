module.exports = {
  name: 'qingdubianmi',
  title: '轻度便秘',
  trigger(text) { return ['一点点便秘', '大便不太通畅'].some(k => text.includes(k)) },
  ask: '是不是有些轻度的便秘，两三天才一次大便，而不是每天一次，同时也不怕冷'
}
