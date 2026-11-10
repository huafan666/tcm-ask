module.exports = {
  name: 'scrotal_edema',
  title: '下身阴部水肿',
  trigger(text) { return ['阴部水肿', '阴囊肿', '下身肿', '阴部湿漉漉', '阴下湿如牛鼻汗', '生殖器周围水肿'].some(k => text.includes(k)) },
  negate(text) { return ['阴部不肿'].some(k => text.includes(k)) },
  ask: '是不是下身（阴部、阴囊）也肿了，还总是湿漉漉的？'
}
