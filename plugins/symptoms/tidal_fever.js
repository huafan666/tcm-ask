module.exports = {
  name: 'tidal_fever',
  title: '潮热',
  kind: 'symptom',
  trigger(text) { return ['潮热', '定时发热', '到点就发热', '每天下午发热', '日晡发热', '傍晚发热'].some(k => text.includes(k)) },
  negate(text) { return ['不发热', '没有潮热', '发热不定时'].some(k => text.includes(k)) },
  ask: '是不是每天到固定时间（尤其下午）就发热，像潮水一样准时？'
}
