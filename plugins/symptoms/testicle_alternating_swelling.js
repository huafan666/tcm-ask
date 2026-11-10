module.exports = {
  name: 'testicle_alternating_swelling',
  title: '阴囊一边大一边小、时上时下',
  trigger(text) { return ['阴囊一边大一边小', '偏有小大', '阴囊时上时下', '疝气来回上下', '睾丸忽上忽下', '阴囊大小不一样'].some(k => text.includes(k)) },
  negate(text) { return ['阴囊两边一样大'].some(k => text.includes(k)) },
  ask: '是不是阴囊（或睾丸）一边大一边小，还会时上时下地移动？'
}
