module.exports = {
  name: 'guizhi_shengjiang_zhishi_tang',
  title: '桂枝生姜枳实汤',
  kind: 'formula',
  // 金匮要略·胸痹心痛短气病脉证并治第九：心中痞，诸逆，心悬痛，桂枝生姜枳实汤主之。
  needs: [
    ['heart_hanging_pain.yes', 'qi_surge.yes'],
    ['heart_hanging_pain.yes', 'hypochondriac_rush.yes'],
    ['heart_hanging_pain.yes']
  ],
  contraindications: ['治「心中痞、诸逆、心悬痛」——心口发堵、各种气逆上冲、心口像悬着疼', '三味：桂枝通阳、生姜散寒降逆、枳实破气消痞', '偏寒饮气逆的心痛，程度较乌头赤石脂丸轻', '和桂枝加桂汤区别：那条是奔豚气从少腹上冲、有灸疮诱因']
}
