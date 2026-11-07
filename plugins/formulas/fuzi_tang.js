module.exports = {
  name: 'fuzi_tang',
  title: '附子汤',
  kind: 'formula',
  // 第305条: 少阴病身体痛手足寒骨节痛脉沉者附子汤主之。
  // 少阴阳虚寒湿(身痛+手足寒+骨节痛)。核心=身体痛+手足逆冷+少阴。
  needs: [
    ['body_pain.yes', 'cold_extremities.yes', 'shaoyin.yes', 'cold_drink_desire.no']
  ],
  contraindications: ['少阴身痛+手足逆冷(阳虚寒湿)', '骨节疼痛', '温阳散寒(附子人参苓术芍)', '与麻黄附子细辛区别(在无发热带表)']
}
