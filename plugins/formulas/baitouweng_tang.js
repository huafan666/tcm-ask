module.exports = {
  name: 'baitouweng_tang',
  title: '白头翁汤',
  kind: 'formula',
  // 第371条: 热利下重者白头翁汤主之。第373条: 下利欲饮水者以有热故也白头翁汤主之。
  // 热利(湿热痢疾): 下利+里急后重(下重)/欲饮水。核心=下利+里急后重。
  // 与桃花汤(虚寒便脓血)区别: 本证为湿热实热,里急后重。
  needs: [
    ['diarrhea.yes', 'tenesmus.yes'],
    ['diarrhea.yes', 'thirsty.yes'],
    // 金匮第十七篇 呕吐哕下利 对应条文
    ['diarrhea.yes','tenesmus.yes','fever.yes']
  ],
  contraindications: ['热利下重(湿热痢疾里急后重)', '清热燥湿止痢(白头翁黄连黄柏秦皮)', '虚寒下利(无热口渴)用桃花汤/四逆辈', '欲饮水者为有热']
}
