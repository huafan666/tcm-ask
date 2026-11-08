module.exports = {
  name: 'gaihua_zhongkuai',
  title: '钙化肿块',
  trigger(text) { return ['钙化肿起来', '肿起来的硬的'].some(k => text.includes(k)) },
  ask: '是不是摸到身上有硬硬的、像石头一样的肿块？'
}
