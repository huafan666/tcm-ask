module.exports = {
  name: 'chuan',
  title: '喘',
  kind: 'symptom',
  trigger(text) { return ['喘', '气喘', '呼吸急促', '喘促'].some(k => text.includes(k)) },
  negate(text) { return ['不喘', '不气喘', '呼吸平稳'].some(k => text.includes(k)) },
  ask: '是不是呼吸急促、气不够用，动一动就喘？'
}
