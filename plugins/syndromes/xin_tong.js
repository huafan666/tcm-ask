module.exports = {
  name: 'xin_tong',
  title: '心痛',
  kind: 'summary',
  // 金匮要略·胸痹心痛短气病脉证并治第九：心中痞，诸逆，心悬痛……心痛彻背，背痛彻心，乌头赤石脂丸主之。
  needs: [
    ['heart_pain_radiate.yes'],
    ['heart_hanging_pain.yes', 'qi_surge.yes'],
    ['heart_hanging_pain.yes', 'hypochondriac_rush.yes']
  ],
  contraindications: ['心痛比胸痹更重、更偏「阴寒极盛」：疼起来前后穿透，心痛彻背、背痛彻心', '属阴寒痼结、阳气不通，用乌头赤石脂丸这类大辛大热药急温', '轻一些的心口悬空样痛、气往上冲，是桂枝生姜枳实汤的方向', '同样要警惕：持续胸痛不缓解、冷汗、发绀是高危信号，须立即就医']
}
