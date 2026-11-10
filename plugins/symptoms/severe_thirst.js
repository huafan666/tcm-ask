module.exports = {
  name: 'severe_thirst',
  title: '大烦渴',
  kind: 'symptom',
  trigger(text) { return ['大烦渴', '烦渴', '口渴甚', '烦躁口渴', '渴饮', '渴得厉害', '特别渴', '渴得难受', '一直想喝水', '贪喝', '渴得不行'].some(k => text.includes(k)) },
  negate(text) { return ['不渴', '口不渴'].some(k => text.includes(k)) },
  ask: '是不是特别口渴、心里烦躁，喝很多水也不解渴？'
}
