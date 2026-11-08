module.exports = {
  name: 'fengchi_tong',
  title: '风池穴痛',
  trigger(text) { return ['头后面痛', '后脖子痛'].some(k => text.includes(k)) },
  ask: '是不是后脑勺、后脖子这块（风池穴附近）发痛、发紧？'
}
