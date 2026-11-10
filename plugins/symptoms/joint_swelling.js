module.exports = {
  name: 'joint_swelling',
  title: '关节肿大',
  trigger(text) { return ['关节肿大', '关节又肿又大', '关节变形', '手指关节粗大', '膝盖肿得很大', '关节肿起来了', '骨节粗大'].some(k => text.includes(k)) },
  negate(text) { return ['关节不肿'].some(k => text.includes(k)) },
  ask: '是不是关节肿大了、看着比正常粗，甚至有点变形？'
}
