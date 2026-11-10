module.exports = {
  name: 'severe_thirst',
  title: '大烦渴',
  kind: 'symptom',
  trigger(text) { return ['大烦渴', '烦渴', '口渴甚', '烦躁口渴', '渴饮', '渴得厉害', '特别渴', '渴得难受', '一直想喝水', '贪喝', '渴得不行'].some(k => text.includes(k)) },
  negate(text) { return ['不渴', '口不渴'].some(k => text.includes(k)) },
  // 原来的问句「是不是特别口渴、心里烦躁，喝很多水也不解渴？」一句话问了两件事：
  // 「渴」和「烦躁」各有专门的节点（restless）。病人「特别渴但不烦躁」时会答「否」，
  // 白虎汤、白虎加人参汤、文蛤散就全丢了 —— 糖尿病的多饮病人正是这种情况。
  // 现在只问渴的程度。
  ask: '是不是渴得很厉害，喝很多水也不解渴？'
}
