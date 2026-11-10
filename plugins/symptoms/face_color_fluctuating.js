module.exports = {
  name: 'face_color_fluctuating',
  title: '脸色忽红忽黑忽白',
  trigger(text) { return ['脸色忽红忽黑', '脸色忽红忽白', '脸红一阵黑一阵', '脸色变来变去', '面色忽赤忽黑', '脸一会儿红一会儿白', '脸色一会儿红一会儿白', '脸上颜色忽深忽浅'].some(k => text.includes(k)) },
  negate(text) { return ['脸色一直正常'].some(k => text.includes(k)) },
  ask: '是不是脸色一阵子发红、一阵子发黑、一阵子发白，来回变？'
}
