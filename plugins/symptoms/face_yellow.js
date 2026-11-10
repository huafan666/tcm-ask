module.exports = {
  name: 'face_yellow',
  title: '面色萎黄',
  trigger(text) { return ['面色萎黄', '脸色萎黄', '面色发黄', '脸色发黄', '面黄', '脸色黄暗', '脸色蜡黄', '面色黄暗'].some(k => text.includes(k)) },
  negate(text) { return ['脸色不黄'].some(k => text.includes(k)) },
  ask: '是不是脸色发黄、发暗、没光泽（但眼白不黄）？'
}
