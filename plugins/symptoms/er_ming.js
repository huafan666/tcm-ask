module.exports = {
  name: 'er_ming',
  title: '耳鸣',
  trigger(text) { return ['耳鸣', '耳朵有声音', '耳朵里响', '耳朵响', '尖锐耳鸣'].some(k => text.includes(k)) },
  ask: '是不是耳朵里老有响声，像嗡嗡声或者尖锐的叫声（耳鸣）？'
}
