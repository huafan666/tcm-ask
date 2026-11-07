module.exports = {
  name: 'huanglian_ajiao_tang',
  title: '黄连阿胶汤',
  kind: 'formula',
  // 第303条: 少阴病得之二三日以上心中烦不得卧黄连阿胶汤主之。
  // 少阴热化(阴虚火旺): 心中烦+不得卧。核心=心烦不得卧。
  needs: [
    ['restless.yes', 'vex_insomnia.yes', 'cold_aversion.no']
  ],
  contraindications: ['心中烦+不得卧(少阴阴虚火旺)', '育阴清热(黄连黄芩芍药阿胶鸡子黄)', '阴虚火旺而非阳虚']
}
