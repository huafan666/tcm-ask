module.exports = {
  name: 'gaihua_zhongkuai',
  title: '钙化肿块',
  trigger(text) { return ['钙化肿起来', '肿起来的硬的'].some(k => text.includes(k)) },
  ask: '是不是感觉有硬硬的的肿块'
}
