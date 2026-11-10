module.exports = {
  name: 'jiao_qi_pain',
  title: '脚气腿脚疼痛抽急',
  trigger(text) { return ['脚气疼痛', '腿脚疼痛抽着疼', '小腿抽痛', '脚肿又疼', '腿脚疼得伸不直', '脚气腿疼', '两脚疼得走不了'].some(k => text.includes(k)) },
  negate(text) { return ['腿脚不疼'].some(k => text.includes(k)) },
  ask: '是不是腿脚（尤其小腿、脚）疼痛、抽着疼，伸不直？'
}
