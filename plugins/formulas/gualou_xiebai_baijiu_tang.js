module.exports = {
  name: 'gualou_xiebai_baijiu_tang',
  title: '栝蒌薤白白酒汤',
  kind: 'formula',
  // 
  needs: [
    ['chest_back_pain.yes', 'short_breath.yes'],
    ['chest_back_pain.yes', 'cough.yes']
  ],
  contraindications: ['胸痹的基础方：胸背痛 + 气短 + 喘息咳唾', '只有三味：栝蒌实（宽胸化痰）、薤白（通阳散结）、白酒（行药势、通阳）', '核心是「通阳散结、豁痰下气」——胸阳不通才痛，把阳气通开', '脉象原文用「寸口沉迟、关上小紧」定位（按口径不入条件）']
}
