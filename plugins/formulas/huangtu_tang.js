module.exports = {
  name: 'huangtu_tang',
  title: '黄土汤',
  kind: 'formula',
  // 金匮要略·惊悸吐衄下血胸满瘀血病脉证并治第十六：下血，先便后血，此远血也，黄土汤主之。
  needs: [
    ['blood_after_stool.yes'],
    ['stool_blood.yes', 'blood_after_stool.yes'],
    ['stool_blood.yes', 'poor_complexion.yes'],
    ['stool_blood.yes', 'cold_extremities.yes']
  ],
  contraindications: ['治「远血」：先拉大便、之后才出血（说明出血部位靠上、离肛门远），多见于胃与十二指肠出血', '黄土（灶心土）温中涩血为君，配白术、附子温阳健脾，地黄、阿胶养血止血，黄芩反佐以防温燥', '寒热并用、温涩为主——适合**虚寒性**下血：血色暗淡、面白乏力、四肢不温', '与赤小豆当归散的区别：那条是「近血」（先血后便、出血部位靠下），偏湿热；本方是远血、偏虚寒', '⚠ 黑便、便血先要排除消化道大出血与肿瘤，及时就医；出血量大时不可只靠中药']
}
