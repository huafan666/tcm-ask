module.exports = {
  name: 'blood_after_stool',
  title: '先大便后出血（远血）',
  trigger(text) { return ['先大便后出血', '先便后血', '大便完了才滴血', '拉完才流血', '便后出血', '拉完擦纸上有血'].some(k => text.includes(k)) },
  negate(text) { return ['不是便后出血'].some(k => text.includes(k)) },
  ask: '是不是先把大便拉出来，之后才出血（原文叫「远血」）？'
}
