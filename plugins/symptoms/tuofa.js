module.exports = {
  name: 'tuofa',
  title: '脱发',
  trigger(text) { return ['脱发', '脱头发'].some(k => text.includes(k)) },
  ask: '是不是脱发',
  contraindications: ['发为血之余']
}
