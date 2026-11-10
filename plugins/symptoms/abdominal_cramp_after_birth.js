module.exports = {
  name: 'abdominal_cramp_after_birth',
  title: '腹中隐痛不断',
  trigger(text) { return ['腹中隐痛不断', '腹中㽲痛', '肚子隐隐作痛不停', '小腹绵绵地痛', '肚子老是隐隐疼', '腹部持续隐痛'].some(k => text.includes(k)) },
  negate(text) { return ['肚子不痛'].some(k => text.includes(k)) },
  ask: '是不是肚子（小腹）一直绵绵地隐隐作痛？'
}
