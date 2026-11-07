module.exports = {
  name: 'guizhi_gancao_longgumuli_tang',
  title: '桂枝甘草龙骨牡蛎汤',
  kind: 'formula',
  // 第118条: 火逆下之，因烧针烦躁者，桂枝甘草龙骨牡蛎汤主之。
  needs: [
    ['restless.yes', 'heart_palp.yes']
  ],
  contraindications: ['火逆烧针后烦躁', '镇摄浮阳、安神', '心阳虚损、浮阳外越']
}
