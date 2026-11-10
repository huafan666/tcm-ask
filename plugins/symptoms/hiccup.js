module.exports = {
  name: 'hiccup',
  title: '打嗝不止（哕）',
  trigger(text) { return ['打嗝不止', '呃逆', '哕', '一直打嗝停不下来', '吃完饭就打嗝', '打嗝连着打'].some(k => text.includes(k)) },
  negate(text) { return ['不打嗝'].some(k => text.includes(k)) },
  ask: '是不是一直打嗝、停不下来（原文叫「哕」）？'
}
