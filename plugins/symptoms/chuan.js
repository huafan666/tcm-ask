module.exports = {
  name: 'chuan',
  title: '喘',
  kind: 'symptom',
  trigger(text) { return ['喘', '气喘', '呼吸急促', '喘促'].some(k => text.includes(k)) },
  negate(text) { return ['不喘', '不气喘', '呼吸平稳'].some(k => text.includes(k)) },
  ask: '有没有觉得呼吸急促、上气不接下气，或者一活动就喘？也就是"喘"的感觉'
}
