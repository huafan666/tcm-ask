module.exports = {
  name: 'skin_scaly',
  title: '皮肤干得像鱼鳞',
  trigger(text) { return ['皮肤干得像鱼鳞', '肌肤甲错', '皮肤粗糙起鳞', '皮肤像蛇皮', '皮肤干枯成片', '腿上皮肤像鱼鳞', '皮肤粗糙发硬'].some(k => text.includes(k)) },
  negate(text) { return ['皮肤光滑'].some(k => text.includes(k)) },
  ask: '是不是皮肤又干又粗糙，像鱼鳞、蛇皮一样一片一片的？'
}
