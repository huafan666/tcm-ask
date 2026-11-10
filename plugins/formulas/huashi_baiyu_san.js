module.exports = {
  name: 'huashi_baiyu_san',
  title: '滑石白鱼散',
  kind: 'formula',
  // 金匮要略·消渴小便不利淋病脉证并治第十三：小便不利……滑石白鱼散、茯苓戎盐汤并主之。
  needs: [
    ['urination_difficulty.yes', 'hematuria.yes'],
    ['urination_difficulty.yes', 'abdominal_pain.yes', 'hematuria.yes']
  ],
  contraindications: ['与蒲灰散、茯苓戎盐汤并列，同为治小便不利的备选方', '三味：滑石（清热利水）、白鱼（即衣鱼，利水）、乱发（血余炭，止血化瘀）', '比蒲灰散更偏「化瘀止血」，适合尿血较明显的情况', '白鱼（衣鱼）是古方用药，现代多不用，须遵医嘱']
}
