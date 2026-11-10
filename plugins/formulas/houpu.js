module.exports = {
  name: 'houpu',
  title: '厚朴',
  kind: 'formula',
  // 原先是 needs:["piyangbuzheng.yes"]，脾阳不振是空节点 → 路径永远不成立。厚朴长于行气除满，改为直接挂腹满。
  needs: ['abdominal_fullness.yes'],
  contraindications: ['去脾湿和宽肠']
}
