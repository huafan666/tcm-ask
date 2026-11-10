module.exports = {
  name: 'yaosuan',
  title: '腰酸',
  // 词表里原来有 '腰痛'，可这个节点的问句明说「是酸不是胀痛、刺痛」——
  // 于是「腰痛」既点亮腰酸、又顺着 腰酸→肾精血虚→补肾精血 一路误判。
  // 现在「腰痛」归 lower_back_pain，这里只管真正的酸软。
  trigger(text) { return ['腰酸', '腰酸痛', '腰软', '腰发软', '腰没力气', '腰膝酸软'].some(k => text.includes(k)) },
  ask: '是不是腰又酸又软、没什么力气，而不是胀痛、刺痛？'
}
