module.exports = {
  name: 'chaihu_yujing',
  title: '柴胡 郁金 龙胆草',
  kind: 'formula',
  // 原先是 needs:["ganqi_bushu.yes"]，而肝气不疏是空节点 → 路径永远不成立。改为直接挂症状：胸胁胀满 + 口苦（疏肝清热的典型靶点）。
  needs: ['hypochondriac_fullness.yes', 'bitter_taste.yes'],
  contraindications: ['疏肝']
}
