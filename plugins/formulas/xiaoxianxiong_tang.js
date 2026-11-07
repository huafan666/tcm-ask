module.exports = {
  name: 'xiaoxianxiong_tang',
  title: '小陷胸汤',
  kind: 'formula',
  // 第138条: 小结胸病，正在心下，按之则痛，脉浮滑者，小陷胸汤主之。
  // 痰热互结轻证: 心下按之则痛、仅心下。核心=按之则痛(仅心下)。
  needs: [
    ['press_only_pain.yes', 'cold_aversion.no']
  ],
  contraindications: ['心下按之则痛(仅心下)', '痰热互结轻证', '清热化痰开结']
}
