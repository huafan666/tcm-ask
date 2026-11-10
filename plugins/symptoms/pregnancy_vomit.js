module.exports = {
  name: 'pregnancy_vomit',
  title: '怀孕后吐得厉害',
  trigger(text) { return ['怀孕后吐得厉害', '妊娠呕吐不止', '孕期一直吐', '怀孕吐个不停', '怀孕后吃不下老吐', '孕吐严重', '吐得厉害', '吐个不停', '吃不下老吐', '孕期吐'].some(k => text.includes(k)) },
  negate(text) { return ['怀孕不吐'].some(k => text.includes(k)) },
  ask: '是不是怀孕以后一直吐、吐得停不下来？'
}
