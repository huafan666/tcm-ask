module.exports = {
  name: 'fuling_sini_tang',
  title: '茯苓四逆汤',
  kind: 'formula',
  // 第69条: 发汗若下之，病仍不解，烦躁者，茯苓四逆汤主之。
  needs: [
    ['restless.yes', 'cold_drink_desire.no']
  ],
  contraindications: ['发汗下后仍烦躁(阴阳俱虚)', '回阳益阴']
}
