module.exports = {
  name: 'xuanfu_daizhe_tang',
  title: '旋覆代赭汤',
  kind: 'formula',
  // 第161条: 伤寒发汗若吐若下解后，心下痞硬，噫气不除者，旋覆代赭汤主之。
  // 心下痞硬+噫气不除(胃虚痰阻). 核心=心下痞+老打嗝。
  needs: [
    ['epigastric_lump_soft.yes', 'belching.yes'],
    ['wei_suan.yes']
  ],
  contraindications: ['心下痞硬+噫气不除', '胃虚痰浊上逆', '降逆化痰益胃', '如果是胃痛，可以加干姜和吴茱萸，然后吃药一个礼拜之后会排出非常多黑色的大便，痛也会去掉，胃口就会恢复']
}
