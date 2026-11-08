module.exports = {
  name: 'mian_chi',
  title: '面赤',
  trigger(text) { return ['面赤', '面色赤', '脸发红', '脸红', '满面通红'].some(k => text.includes(k)) },
  negate(text) { return ['面不红', '脸不红', '脸色不红'].some(k => text.includes(k)) },
  ask: '是不是脸发红、发烫？'
}
