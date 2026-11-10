module.exports = {
  name: 'yin_chui',
  title: '阴道排气有声',
  trigger(text) { return ['阴道排气有声', '阴吹', '下面有气出来还响', '阴道会排气', '下身像放屁一样响'].some(k => text.includes(k)) },
  negate(text) { return ['没有这种情况'].some(k => text.includes(k)) },
  ask: '是不是阴道会像放屁一样排气、还有声音？'
}
