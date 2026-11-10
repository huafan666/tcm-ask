module.exports = {
  name: 'chest_stuffy',
  title: '胸中窒',
  trigger(text) { return ['胸中窒', '胸中堵', '胸口发堵', '胸膈憋闷', '胸中憋'].some(k => text.includes(k)) },
  negate(text) { return ['胸口不堵', '胸中不闷'].some(k => text.includes(k)) },
  ask: '是不是觉得胸口里堵着一块，闷得慌但又不痛？'
}
