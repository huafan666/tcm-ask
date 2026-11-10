module.exports = {
  name: 'dangui_shengjiang_yangrou_tang',
  title: '当归生姜羊肉汤',
  kind: 'formula',
  // 金匮要略·腹满寒疝宿食病脉证并治第十：寒疝腹中痛，及胁痛里急者，当归生姜羊肉汤主之。
  needs: [
    ['abdominal_pain.yes', 'abdominal_tension.yes'],
    ['abdominal_pain.yes', 'hypochondriac_side_pain.yes']
  ],
  contraindications: ['治虚寒性腹痛：腹中痛、胁痛、肚子拘急发紧（里急）', '只有三味，而且**羊肉是食材**——当归养血、生姜温中、羊肉温补，是药食同源的温补方', '适合血虚有寒的腹痛：疼得绵绵不休、喜温喜按、面色淡', '和附子粳米汤、大建中汤区别：那些是寒实剧痛急着温散，本方是虚寒隐痛，温和温补', '实热腹痛、阴虚有热者不宜']
}
