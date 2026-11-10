module.exports = {
  name: 'vomiting',
  title: '呕逆',
  trigger(text) { return ['呕', '呕逆', '干呕', '呕吐', '吐完', '吐后', '吐了', '呕吐过', '吐得厉害', '吐个不停', '吐得难受', '吐了一地'].some(k => text.includes(k)) },
  negate(text) { return ['不呕', '不想吐', '不吐', '没有呕'].some(k => text.includes(k)) },
  ask: '是不是真的有过呕吐动作——吐出东西来，或者干呕（想吐但吐不出东西）？'
}
