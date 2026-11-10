module.exports = {
  name: 'fuzi_tang',
  title: '附子汤',
  kind: 'formula',
  // 
  needs: [
    ['body_pain.yes', 'cold_extremities.yes', 'joint_pain_rigid.yes'],
    ['body_pain.yes', 'cold_extremities.yes', 'cold_drink_desire.no']
  ],
  contraindications: ['少阴身痛+手足逆冷(阳虚寒湿)', '骨节疼痛', '温阳散寒(附子人参苓术芍)', '与麻黄附子细辛区别(在无发热带表)']
}
