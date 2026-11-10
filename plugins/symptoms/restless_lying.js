module.exports = {
  name: 'restless_lying',
  title: '想躺躺不住',
  trigger(text) { return ['想躺躺不住', '躺下又躺不住', '躺下就难受', '躺也躺不踏实'].some(k => text.includes(k)) },
  negate(text) { return ['躺下就睡得着'].some(k => text.includes(k)) },
  ask: '是不是很想躺下来，可躺下又躺不住、怎么都不舒服？'
}
