module.exports = {
  name: 'hemiplegia',
  title: '半身不遂',
  trigger(text) { return ['半身不遂', '半边身子不能动', '半身不随', '一侧肢体不能动', '半边瘫痪', '一边身子不听使唤', '半身不能活动'].some(k => text.includes(k)) },
  negate(text) { return ['两边都能动', '活动自如'].some(k => text.includes(k)) },
  ask: '是不是半边身子（手或腿，或者整个一侧）不能动、不听使唤？'
}
