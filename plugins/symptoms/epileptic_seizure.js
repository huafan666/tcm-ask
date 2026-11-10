module.exports = {
  name: 'epileptic_seizure',
  title: '抽搐痉挛发作',
  trigger(text) { return ['抽搐', '抽风', '癫痫发作', '手脚抽筋样抽动', '昏倒抽搐', '痉挛发作', '突然倒地抽'].some(k => text.includes(k)) },
  negate(text) { return ['没有抽搐'].some(k => text.includes(k)) },
  ask: '是不是会突然抽搐、抽风，甚至昏倒短暂不省人事？'
}
