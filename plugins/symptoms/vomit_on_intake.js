module.exports = {
  name: 'vomit_on_intake',
  title: '食入口即吐',
  kind: 'symptom',
  trigger(text) { return ['食入口即吐', '入口即吐', '吃完马上吐', '一吃就吐', '刚吃就吐'].some(k => text.includes(k)) },
  negate(text) { return ['进食能存', '吃了不吐'].some(k => text.includes(k)) },
  ask: '是不是东西一进嘴、刚吃下去就吐出来？'
}
