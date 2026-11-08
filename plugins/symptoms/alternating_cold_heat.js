module.exports = {
  name: 'alternating_cold_heat',
  title: '往来寒热',
  kind: 'symptom',
  trigger(text) { return ['往来寒热', '一阵冷一阵热', '寒热往来', '时冷时热', '发冷发热交替', '一阵子发冷一阵子发热', '冷一阵热一阵', '打完寒颤就发热'].some(k => text.includes(k)) },
  negate(text) { return ['不往来寒热'].some(k => text.includes(k)) },
  ask: '是不是一阵发冷、一阵发热，冷热交替着来（往来寒热）？'
}

