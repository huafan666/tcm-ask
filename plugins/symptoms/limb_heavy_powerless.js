module.exports = {
  name: 'limb_heavy_powerless',
  title: '肢体沉重抬不动',
  trigger(text) { return ['肢体沉重抬不动', '胳膊腿重得抬不起来', '手脚沉得动不了', '身子重得撑不住', '四肢沉重无力', '重得抬不起来'].some(k => text.includes(k)) },
  negate(text) { return ['活动轻快'].some(k => text.includes(k)) },
  ask: '是不是胳膊腿又沉又重，抬起来觉得很费劲、甚至抬不动？'
}
