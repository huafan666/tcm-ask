module.exports = {
  name: 'no_sweat',
  title: '无汗',
  kind: 'symptom',
  // 「不出汗 / 没出汗」以前只在 sweat 的 negate 里出现过，只把 sweat 判成 no，
  // 结果「无汗」这个正面节点始终是 unknown，麻黄汤这类靠「无汗」判的方就摸不到。
  // 现在两件事一起做：① 词表补上这些说法；② 引擎里 sweat / no_sweat 是「互补」关系
  // （一真一假、一假一真），任何一边定了，另一边自动定。
  trigger(text) { return ['无汗', '没汗', '没有汗', '不出汗', '不流汗', '没出汗', '汗不出',
    '一点汗都没有', '一点汗没出', '干爽没汗', '皮肤光滑', '身上是干的'].some(k => text.includes(k)) },
  negate(text) { return ['有汗', '身上是湿的', '在出汗'].some(k => text.includes(k)) },
  ask: '是不是完全不出汗，皮肤摸着干爽？'
}

