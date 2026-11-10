module.exports = {
  name: 'jiao_qi_chong_xin',
  title: '脚气冲心',
  kind: 'summary',
  // 金匮要略·中风历节病脉证并治第五：矾石汤治脚气冲心。
  needs: [
    ['foot_swelling_drop.yes', 'heart_palp.yes'],
    ['foot_swelling_drop.yes', 'short_breath.yes']
  ],
  contraindications: ['脚气病起初是脚肿、腿沉，严重时水湿之邪往上冲犯心胸，叫「脚气冲心」', '冲到心就会心慌、气短、胸口憋闷，这是危重信号', '中医的「脚气」指维生素 B1 缺乏类的湿性脚气（脚肿），不是现在说的脚癣', '矾石汤是外洗方（煎水浸脚），用来引湿下行']
}
