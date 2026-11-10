module.exports = {
  name: 'epigastric_pressing_pain',
  title: '心口按下去又满又痛',
  trigger(text) { return ['心口按下去又满又痛', '心下满痛', '按之心下满痛', '心口一按就痛还发满', '胃这块按着满痛', '心口压着又胀又疼', '心口按着又满又痛', '心口按下又满又痛', '按下又满又痛', '心口按着满痛', '胃这块按下去满痛', '心口一按又胀又疼'].some(k => text.includes(k)) },
  negate(text) { return ['心口按着不痛'].some(k => text.includes(k)) },
  ask: '是不是心口（胃这块）又胀满又痛，一按下去更明显？'
}
