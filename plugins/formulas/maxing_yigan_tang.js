module.exports = {
  name: 'maxing_yigan_tang',
  title: '麻黄杏仁薏苡甘草汤',
  kind: 'formula',
  // 金匮要略·痉湿暍病脉证并治第二：病者一身尽疼，发热，日晡所剧者，名风湿。此病伤于汗出当风，或久伤取冷所致也。可与麻黄杏仁薏苡甘草汤。
  needs: ['body_pain.yes', 'fever.yes', 'tidal_fever.yes'],
  contraindications: ['风湿在表、有化热之势：一身尽疼、发热而日晡加重', '「日晡所剧」是风湿化热的定时加重（对应现有「潮热」节点）', '病因为汗出当风或久伤取冷', '麻黄杏仁薏苡甘草汤：微汗祛风、薏苡清热除湿（比麻黄加术汤多一层清热）']
}
