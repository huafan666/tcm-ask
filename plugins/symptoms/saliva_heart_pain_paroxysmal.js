module.exports = {
  name: 'saliva_heart_pain_paroxysmal',
  title: '吐口水、心口痛一阵一阵',
  trigger(text) { return ['吐口水心口痛一阵一阵', '吐涎心痛发作有时', '心口痛时好时坏还吐口水', '肚子一阵阵痛还流口水', '心口疼一阵一阵发作'].some(k => text.includes(k)) },
  negate(text) { return ['心口不痛'].some(k => text.includes(k)) },
  ask: '是不是心口（肚子）一阵一阵地痛、还老吐口水，发作有时间规律？'
}
