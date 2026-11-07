module.exports = {
  name: 'xiazhui',
  title: '下坠',
  trigger(text) { return ['下坠痛', '下坠感'].some(k => text.includes(k)) },
  ask: '是不是感觉肚子下坠或肛门下坠或膀胱下坠或疝气等，其中之一即可'
}
