module.exports = {
  name: 'nausea',
  title: '恶心（想吐但没吐）',
  trigger(text) { return ['恶心', '想吐', '欲吐', '泛恶', '作呕', '心里呕得慌', '反胃想吐'].some(k => text.includes(k)) },
  negate(text) { return ['不恶心', '不想吐'].some(k => text.includes(k)) },
  ask: '是不是只是恶心、想吐，但并没有真的吐出来（也不是干呕）？'
}
