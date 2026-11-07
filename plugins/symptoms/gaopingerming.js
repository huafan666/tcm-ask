module.exports = {
  name: 'gaopingerming',
  title: '高频耳鸣',
  trigger(text) { return ['耳鸣', '尖锐耳鸣', '刺耳'].some(k => text.includes(k)) },
  ask: '是不是感觉比较尖锐的，高频的耳鸣'
}
