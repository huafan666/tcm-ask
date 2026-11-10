module.exports = {
  name: 'limb_straight_spasm',
  title: '胳膊腿绷直抽筋',
  trigger(text) { return ['胳膊腿绷直抽筋', '臂脚直', '腿抽筋绷得直', '手脚绷直伸不开', '小腿抽筋绷紧', '抽筋抽得腿是直的'].some(k => text.includes(k)) },
  negate(text) { return ['手脚能自由伸展'].some(k => text.includes(k)) },
  ask: '是不是胳膊或腿突然绷直、抽筋，伸不开？'
}
