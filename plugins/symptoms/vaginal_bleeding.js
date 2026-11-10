module.exports = {
  name: 'vaginal_bleeding',
  title: '阴道下血不止',
  trigger(text) { return ['阴道下血不止', '漏下', '下面一直出血', '阴道流血不止', '怀孕后出血', '月经淋漓不尽', '下血不止'].some(k => text.includes(k)) },
  negate(text) { return ['没有出血'].some(k => text.includes(k)) },
  ask: '是不是阴道一直有血、淋漓不止？'
}
