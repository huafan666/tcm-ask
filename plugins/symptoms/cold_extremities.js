module.exports = {
  name: 'cold_extremities',
  title: '手足逆冷',
  kind: 'symptom',
  trigger(text) { return ['手足逆冷', '手脚冰冷', '四肢厥冷', '手冷脚冷', '四肢逆冷', '手脚发凉', '手足寒', '厥', '手一直冷', '手冷'].some(k => text.includes(k)) },
  negate(text) { return ['手脚暖和', '手足温', '手脚不冷'].some(k => text.includes(k)) },
  ask: '是不是手脚一直冰凉，怎么捂都暖不过来，冷得超过手腕脚踝（手足逆冷）？'
}
