module.exports = {
  name: 'zhuye_shigao_tang',
  title: '竹叶石膏汤',
  kind: 'formula',
  // 397条：伤寒解后，虚羸少气，气逆欲吐，竹叶石膏汤主之。
  needs: ['short_breath.yes', 'nausea.yes', 'weight_loss.yes'],
  contraindications: ['397条：伤寒解后，虚羸少气，气逆欲吐', '竹叶、石膏、半夏、麦冬、人参、甘草、粳米——清热生津、益气和胃', '与白虎加人参汤的区别：本方是热病**解后**余热未尽、气津两伤，不是热盛当下', '原文「虚羸少气」是必见之证，无消瘦短气者不必用']
}
