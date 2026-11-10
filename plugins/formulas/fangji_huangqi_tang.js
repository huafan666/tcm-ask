module.exports = {
  name: 'fangji_huangqi_tang',
  title: '防己黄芪汤',
  kind: 'formula',
  //  | 金匮 14.27：风水，脉浮身重，汗出恶风者，防己黄芪汤主之。
  needs: [
    ['body_heavy.yes', 'sweat.yes', 'wind_aversion.yes'],
    ['pitting_edema.yes', 'wind_aversion.yes', 'sweat.yes']
  ],
  contraindications: ['风湿在表、表虚不固、水湿不化（身重是水湿停聚，汗出恶风是表虚）', '主方防己黄芪汤：益气固表、利水除湿', '脉浮身为外证；本项目脉象暂不入判定', '与麻黄加术汤区别：本方有汗出恶风（表虚），麻黄加术汤无汗（表实）', '金匮 14.27 的风水也用它：以水肿为主时，条件改为「水肿 + 汗出 + 恶风」']
}
