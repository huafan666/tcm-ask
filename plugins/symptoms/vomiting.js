module.exports = {
  name: 'vomiting',
  title: '呕逆',
  kind: 'symptom',
  trigger(text) { return ['呕', '呕逆', '干呕', '想吐', '欲吐', '呕吐', '吐完', '吐后', '吐了', '吐出来', '呕吐过'].some(k => text.includes(k)) },
  negate(text) { return ['不呕', '不想吐', '不吐'].some(k => text.includes(k)) },
  ask: '是不是会恶心想吐、甚至吐出来？'
}
