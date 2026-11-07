module.exports = {
  name: 'guizhi_xinjia_tang',
  title: '桂枝加芍药生姜各一两人参三两新加汤',
  kind: 'formula',
  // 第62条: 发汗后，身疼痛(脉沉迟)者，新加汤主之。
  // 发汗后气血不足身疼。暂不做脉(去脉沉迟)。核心=身疼痛。
  needs: [
    ['body_pain.yes', 'sweat.yes']
  ],
  contraindications: ['发汗后身疼(气血虚)', '桂枝汤加芍药生姜人参', '补营益气治汗后身痛']
}

