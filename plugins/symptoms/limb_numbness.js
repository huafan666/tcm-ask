module.exports = {
  name: 'limb_numbness',
  title: '肌肤麻木不仁',
  trigger(text) { return ['肌肤麻木', '半身麻木', '身上发麻', '手脚发麻没知觉', '皮肤没知觉', '麻木不仁', '一侧发麻', '胳膊腿发麻'].some(k => text.includes(k)) },
  negate(text) { return ['感觉正常', '不发麻'].some(k => text.includes(k)) },
  ask: '是不是身上（或某一侧）发麻、木木的，摸上去知觉变迟钝？'
}
