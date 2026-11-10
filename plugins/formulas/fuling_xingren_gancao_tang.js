module.exports = {
  name: 'fuling_xingren_gancao_tang',
  title: '茯苓杏仁甘草汤',
  kind: 'formula',
  // 
  needs: [
    ['chest_qi_stuffiness.yes', 'short_breath.yes', 'cough.yes'],
    ['chest_qi_stuffiness.yes', 'short_breath.yes']
  ],
  contraindications: ['治胸痹轻证：胸中气塞、短气，偏水饮停聚', '三味：茯苓利水、杏仁宣肺降气、甘草和中——宣肺利水', '原文和橘枳姜汤并列，两者一偏饮、一偏气：本方偏「饮」，橘枳姜偏「气」', '胸痹轻证可用，重证需配合其他方']
}
