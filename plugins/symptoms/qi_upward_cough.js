module.exports = {
  name: 'qi_upward_cough',
  title: '咳喘气往上冲',
  trigger(text) { return ['咳喘气往上冲', '咳嗽气往上顶', '咳逆上气', '咳得气往上冲', '气直往上冲', '咳嗽气逆', '喘得气往上顶', '咳嗽气往上冲', '气往上冲', '气往上冲得厉害', '气一直往上顶', '咳得气往上涌', '气逆不降', '咳嗽气往上涌'].some(k => text.includes(k)) },
  negate(text) { return ['气不上冲'].some(k => text.includes(k)) },
  ask: '是不是咳嗽的时候气一个劲往上冲、顶得难受，按都按不住？'
}
