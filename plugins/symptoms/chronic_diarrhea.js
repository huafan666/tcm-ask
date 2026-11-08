module.exports = {
  name: 'chronic_diarrhea',
  title: '久利(拉肚子久)',
  kind: 'symptom',
  trigger(text) { return ['久利', '拉肚子久', '慢性腹泻', '久泻', '腹泻很久', '反复拉肚'].some(k => text.includes(k)) },
  negate(text) { return ['拉肚子好了', '不便'].some(k => text.includes(k)) },
  ask: '是不是拉肚子拖了很久，反反复复老不好？'
}
