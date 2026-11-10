module.exports = {
  name: 'saliva_spit',
  title: '老吐清水唾沫',
  trigger(text) { return ['老吐清口水', '吐涎沫', '吐清水唾沫', '嘴里老有稀唾沫', '吐白色稀沫', '口水多老是吐', '多涎唾', '吐清稀唾沫', '老吐口水', '口水多得吐不完'].some(k => text.includes(k)) },
  negate(text) { return ['不吐唾沫'].some(k => text.includes(k)) },
  ask: '是不是嘴里总往外冒清稀的唾沫、口水，得一直吐？'
}
