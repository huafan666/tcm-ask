module.exports = {
  name: 'lower_abdominal_lump',
  title: '少腹急结',
  kind: 'symptom',
  trigger(text) { return ['少腹急结', '小腹硬', '少腹硬满', '下腹急结', '小腹拘急硬结'].some(k => text.includes(k)) },
  negate(text) { return ['腹不硬'].some(k => text.includes(k)) }
}

