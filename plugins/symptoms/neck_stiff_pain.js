module.exports = {
  name: 'neck_stiff_pain',
  title: '颈项强痛',
  kind: 'symptom',
  trigger(text) { return ['颈项强痛', '头项强痛', '项背强', '项背强几几', '脖子硬', '脖子僵硬', '颈背强', '后颈背发硬', '上半部发僵', '脖子和背发僵', '脖子发硬', '后脖子发硬', '项背发硬', '身体强几几', '几几然'].some(k => text.includes(k)) },
  negate(text) { return ['颈项不强不痛', '脖子不僵'].some(k => text.includes(k)) },
  ask: '是不是后脖子连着后背发僵、发硬，还有点痛？'
}

