module.exports = {
  name: 'aimless_walking',
  title: '到处乱走不停',
  trigger(text) { return ['到处乱走', '走来走去停不下来', '漫无目的乱走', '妄行', '整天走来走去', '乱跑停不住'].some(k => text.includes(k)) },
  negate(text) { return ['安安静静待着'].some(k => text.includes(k)) },
  ask: '是不是漫无目的地到处乱走、走来走去停不下来？'
}
