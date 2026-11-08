module.exports = {
  name: 'chongji',
  title: '虫积',
  trigger(text) { return ['肚子里有虫子', '排便有虫子'].some(k => text.includes(k)) },
  ask: '是不是肚子里有虫子，或者大便里排出过虫子？'
}
