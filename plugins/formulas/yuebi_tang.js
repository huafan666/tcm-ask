module.exports = {
  name: 'yuebi_tang',
  title: '越婢汤',
  kind: 'formula',
  // 金匮要略·水气病脉证并治第十四：风水恶风，一身悉肿，脉浮不渴，续自汗出，无大热，越婢汤主之。
  needs: [
    ['pitting_edema.yes', 'wind_aversion.yes', 'sweat.yes'],
    ['pitting_edema.yes', 'wind_aversion.yes', 'thirsty.no']
  ],
  contraindications: ['治风水：全身都肿、怕风、不停地自己出汗、不渴、没有明显高热', '五味：麻黄（重用六两）、石膏、生姜、大枣、甘草', '关键在「续自汗出」还照用麻黄——因为有肿、要宣肺利水，汗出是表虚不是禁汗的依据', '「不渴」说明里无热盛，「无大热」说明热不重', '和防己黄芪汤区别：那条是汗出恶风但以「身重、脉浮」为主，偏气虚；本条以「一身悉肿」为主']
}
