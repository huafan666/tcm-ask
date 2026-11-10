module.exports = {
  name: 'orthopnea',
  title: '躺不平、只能坐着喘',
  trigger(text) { return ['躺不平', '只能坐着喘', '躺下就喘不上气', '不能平躺', '但坐不得眠', '躺下气就上不来', '夜里得坐起来喘', '喘不得卧', '躺不平气上来', '一躺就喘', '不能躺只能坐', '要坐起来喘'].some(k => text.includes(k)) },
  negate(text) { return ['能平躺'].some(k => text.includes(k)) },
  ask: '是不是一躺下就喘不上气，只能坐着或半靠着才舒服？'
}
