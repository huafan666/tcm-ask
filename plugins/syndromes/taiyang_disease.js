module.exports = {
  name: 'taiyang_disease',
  title: '太阳之为病',
  kind: 'summary',
  // 第1条: 太阳之为病，脉浮，头项强痛而恶寒。
  // 暂不做脉，故只用 颈项强痛 + 恶寒 判定；脉浮待做脉后加回。
  needs: ['neck_stiff_pain.yes', 'cold_aversion.yes']
}

