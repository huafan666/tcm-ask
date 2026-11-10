module.exports = {
  name: 'eyes_dark_rims',
  title: '眼眶四周发黑',
  trigger(text) { return ['眼眶发黑', '眼圈发黑', '眼睛四周发黑', '黑眼圈很重', '眼周发黑', '眼角发黑', '眼睛周围发黑', '眼圈四周发黑', '眼眶四周发黑', '眼睛周围一圈黑', '眼圈一圈黑'].some(k => text.includes(k)) },
  negate(text) { return ['眼圈不黑', '眼眶不黑'].some(k => text.includes(k)) },
  ask: '是不是眼睛四周（眼圈、眼角）发黑，像画了个黑圈？'
}
