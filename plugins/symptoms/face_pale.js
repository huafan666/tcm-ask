module.exports = {
  name: 'face_pale',
  title: '面色苍白',
  trigger(text) { return ['脸色苍白', '面色苍白', '脸发白', '脸色发白', '面白', '惨白', '没血色', '面色㿠白'].some(k => text.includes(k)) },
  negate(text) { return ['脸色红润', '面色红润'].some(k => text.includes(k)) },
  ask: '是不是脸色发白、苍白，没有血色？'
}
