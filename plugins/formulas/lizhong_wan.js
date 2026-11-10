module.exports = {
  name: 'lizhong_wan',
  title: '理中丸',
  kind: 'formula',
  // 386条：霍乱，头痛发热，身疼痛，热多欲饮水者，五苓散主之；寒多不用水者，理中丸主之。
  needs: ['vomiting.yes', 'diarrhea.yes', 'thirsty.no'],
  contraindications: ['386条：霍乱吐利，「寒多不用水者」——不渴是中焦虚寒的抓手', '与五苓散的区别就在渴与不渴：热多欲饮水用五苓散，寒多不用水用理中丸', '丸、汤两用：腹中未热、益至三四丸；然不及汤，汤法胜丸', '人参、干姜、甘草、白术——温中祛寒、补气健脾']
}
