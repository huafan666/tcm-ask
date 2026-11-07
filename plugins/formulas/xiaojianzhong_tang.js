module.exports = {
  name: 'xiaojianzhong_tang',
  title: '小建中汤',
  kind: 'formula',
  // 第100/102条: 腹中急痛(先与小建中)；心中悸而烦者，小建中汤主之。
  // 中焦虚寒、气血不足。核心=腹痛(喜按) 或 心悸而烦。
  needs: [
    ['abdominal_fullness.yes', 'abdominal_pain.yes'],
    ['heart_palp.yes', 'restless.yes']
  ],
  contraindications: ['虚寒腹痛、心中悸而烦', '温中补虚、缓急止痛', '呕家不可用(甜)', '单纯腹胀无痛宜厚朴生姜汤']
}
