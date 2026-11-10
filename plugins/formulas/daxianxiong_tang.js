module.exports = {
  name: 'daxianxiong_tang',
  title: '大陷胸汤',
  kind: 'formula',
  // 第134/135/136/137条: 结胸热实，心下痛按之石硬；或从心下至少腹硬满而痛不可近。
  // 水热互结重证: 心下至少腹硬满痛(不按也痛)。核心=心下至少腹硬满痛。
  needs: [
    ['full_epigastric_hard_pain.yes', 'cold_aversion.no'],
    ['full_epigastric_hard_pain.yes', 'head_sweat_only.yes']
  ],
  contraindications: ['心下至少腹硬满痛(不按也痛)', '水热互结重证', '泻热逐水(甘遂)', '得快利止后服']
}
