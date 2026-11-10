module.exports = {
  name: 'self_talk_ceaseless',
  title: '自言自语说个不停',
  trigger(text) { return ['自言自语说个不停', '一个人在那说话', '独自说个不停', '独语不休', '对着空气说话', '自己嘀咕个不停'].some(k => text.includes(k)) },
  negate(text) { return ['说话正常'].some(k => text.includes(k)) },
  ask: '是不是一个人自言自语、说个不停，别人叫也不怎么理？'
}
