module.exports = {
  name: 'zhizi_bopi_tang',
  title: '栀子檗皮汤',
  kind: 'formula',
  // 第261条: 伤寒身黄发热栀子檗皮汤主之。
  // 身黄+发热(湿热在表/较轻)，无小便不利明显。清热燥湿退黄(栀子甘草黄檗)。
  needs: [
    ['jaundice.yes', 'fever.yes']
  ],
  contraindications: ['身黄+发热(湿热黄)', '小便不利明显宜茵陈蒿', '清热燥湿退黄(栀子黄檗甘草)']
}
