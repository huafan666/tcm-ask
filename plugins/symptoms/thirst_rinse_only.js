module.exports = {
  name: 'thirst_rinse_only',
  title: '口干只想漱口不想咽',
  trigger(text) { return ['口干只想漱口', '但欲漱水不欲咽', '漱漱口就吐掉', '想漱口不想喝水', '水含在嘴里不咽下去', '口干含着水又吐了'].some(k => text.includes(k)) },
  negate(text) { return ['渴了就想大口喝水'].some(k => text.includes(k)) },
  ask: '是不是嘴里干，只想含口水漱漱口、并不想咽下去？'
}
