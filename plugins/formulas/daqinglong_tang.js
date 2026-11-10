module.exports = {
  name: 'daqinglong_tang',
  title: '大青龙汤',
  kind: 'formula',
  // 第38条: 太阳中风脉浮紧发热恶寒身疼痛不汗出而烦躁者，大青龙汤主之。
  // 表寒里热，核心=无汗+烦躁。与麻黄汤区别在有烦躁(有里热)。脉浮紧不做。
  needs: [
    ['no_sweat.yes', 'restless.yes', 'severe_thirst.no'],
    ['no_sweat.yes', 'restless.yes', 'body_pain.yes', 'severe_thirst.no'],
    ['no_sweat.yes', 'restless.yes', 'cold_aversion.yes', 'severe_thirst.no'],
    // 金匮 12.24：病溢饮者，当发其汗，大青龙汤主之
    ['yi_yin.yes'],
    // 39条：脉浮缓，身不疼，但重，乍有轻时，无少阴证者，大青龙汤发之
    // 「身不疼但重」不是溢饮（溢饮要疼重），所以单列一条
    ['no_sweat.yes', 'body_heavy.yes', 'body_pain.no']
  ],
  contraindications: ['表寒里热(无汗而烦躁)', '若脉微弱、汗出恶风者不可服(表虚忌)', '服后汗多者温粉粉之', '一服汗出者停后服，恐亡阳']
}

