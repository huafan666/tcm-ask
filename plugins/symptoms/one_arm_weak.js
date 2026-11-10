module.exports = {
  name: 'one_arm_weak',
  title: '只有一只胳膊抬不起来',
  trigger(text) { return ['一只胳膊抬不起来', '单侧胳膊不能动', '一个胳膊动不了', '胳膊不听使唤', '一只手举不起来', '一侧上肢不能动'].some(k => text.includes(k)) },
  negate(text) { return ['胳膊活动正常'].some(k => text.includes(k)) },
  ask: '是不是只有一只胳膊抬不起来、动不了，身子其他部分还好？'
}
