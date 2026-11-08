module.exports = {
  name: 'qingdubianmi',
  title: '轻度便秘',
  trigger(text) { return ['一点点便秘', '大便不太通畅'].some(k => text.includes(k)) },
  ask: '是不是有点便秘，两三天才一次大便，但不觉得怕冷？'
}
