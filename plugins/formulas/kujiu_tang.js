module.exports = {
  name: 'kujiu_tang',
  title: '苦酒汤',
  kind: 'formula',
  // 
  needs: [
    ['throat_ulcer.yes', 'speech_difficulty.yes'],
    ['houlongjinsuo.yes', 'voice_hoarse.yes']
  ],
  contraindications: ['咽中生疮+不能语言声不出', '清利咽窍(半夏苦酒)', '含咽之,烂蚀客热', '条文收紧依据：伤寒 312：少阴病，咽中伤，生疮，不能语言，声不出者，苦酒汤主之']
}
