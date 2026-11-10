module.exports = {
  name: 'water_reflux',
  title: '喝水就吐',
  trigger(text) { return ['喝水就吐', '一喝水就吐出来', '水入则吐', '喝了水马上呕', '水喝不下去会吐', '喝水反而吐水'].some(k => text.includes(k)) },
  negate(text) { return ['喝水不吐'].some(k => text.includes(k)) },
  ask: '是不是很渴想喝水，可水一喝下去就吐出来？'
}
