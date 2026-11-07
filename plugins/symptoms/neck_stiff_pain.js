module.exports = {
  name: 'neck_stiff_pain',
  title: '颈项强痛',
  kind: 'symptom',
  trigger(text) { return ['颈项强痛', '头项强痛', '项背强', '项背强几几', '脖子硬', '脖子僵硬', '颈背强', '后颈背发硬', '上半部发僵', '脖子和背发僵'].some(k => text.includes(k)) },
  negate(text) { return ['颈项不强不痛', '脖子不僵'].some(k => text.includes(k)) },
  ask: '脖子和项背（后颈到后背上半部）是不是发僵、发硬、有点痛？摸上去很板。这是因为上部津液不足，通常用葛根来升津。'
}

