module.exports = {
  name: 'ganjiang_fuzi_tang',
  title: '干姜附子汤',
  kind: 'formula',
  // 第61条: 下之后复发汗，昼日烦躁不得眠，夜而安静，不呕不渴，无表证，身无大热者。
  // 阳虚: 昼烦夜静为特征(阳虚阴盛)。核心=昼烦夜静。
  needs: [
    ['day_agitated_night_calm.yes', 'cold_drink_desire.no']
  ],
  contraindications: ['阳虚阴盛(昼烦夜静)', '下后复汗亡阳', '身无大热，不可误作热证']
}

