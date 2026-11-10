module.exports = {
  name: 'frequent_yawning',
  title: '老伸懒腰打哈欠',
  trigger(text) { return ['老伸懒腰打哈欠', '数欠伸', '不停打哈欠', '总是伸懒腰', '哈欠连天', '老想伸懒腰'].some(k => text.includes(k)) },
  negate(text) { return ['不打哈欠'].some(k => text.includes(k)) },
  ask: '是不是总是打哈欠、伸懒腰，控制不住？'
}
