module.exports = {
  name: 'huang_dan',
  title: '黄疸',
  kind: 'summary',
  // 金匮要略·黄疸病脉证并治第十五：然黄家所得，从湿得之。一身尽发热而黄，肚热，热在里，当下之。
  needs: [
    ['jaundice.yes'],
    ['jaundice.yes', 'thirsty.yes', 'urination_difficulty.yes'],
    ['jaundice.yes', 'abdominal_fullness.yes', 'vex_insomnia.yes']
  ],
  contraindications: ['黄疸的核心是**「黄家所得，从湿得之」**——湿邪是根本，所以在湿不在燥', '基本表现：皮肤、眼白发黄，尿黄，可伴发热、腹满、口渴、小便不利', '分型：谷疸（饮食所伤）、酒疸（喝酒所致）、女劳疸（房劳所致）、黑疸（久病转归）', '治法总纲：「诸病黄家，但利其小便」——利小便祛湿是主法；脉浮有表证的才用汗法', '预后判据（15.12）：「疸而渴者难治，疸而不渴者可治」——口渴说明津伤、热重，难治', '⚠ 黄疸必须查肝功能、胆红素、腹部超声，分清肝细胞性、梗阻性、溶血性，不能只靠中医辨证']
}
