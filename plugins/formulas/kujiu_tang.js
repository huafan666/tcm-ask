module.exports = {
  name: 'kujiu_tang',
  title: '苦酒汤',
  kind: 'formula',
  // 第312条: 少阴病咽中伤生疮不能语言声不出者苦酒汤主之。
  // 咽中生疮+不能语言声不出。核心=咽中生疮+语言难出。
  needs: [
    ['throat_ulcer.yes', 'speech_difficulty.yes'],
    ['houlongjinsuo.yes'],
    ['tunyankunnan.yes']
  ],
  contraindications: ['咽中生疮+不能语言声不出', '清利咽窍(半夏苦酒)', '含咽之,烂蚀客热']
}
