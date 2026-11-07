module.exports = {
  name: 'wenha_san',
  title: '文蛤散',
  kind: 'formula',
  // 第141条: 病在阳应以汗解之，反以冷水之灌之，其热被劫不得去，弥更益烦，肉上粟起，意欲饮水反不渴者，服文蛤散。
  // 水寒郁遏表热(意欲饮水反不渴). 核心=欲饮水但不渴。
  needs: [
    ['thirsty.no', 'restless.yes']
  ],
  contraindications: ['意欲饮水反不渴(水寒郁热)', '肉上粟起', '清热利湿']
}
