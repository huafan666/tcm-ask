module.exports = {
  name: 'puhui_san',
  title: '蒲灰散',
  kind: 'formula',
  // 金匮要略·消渴小便不利淋病脉证并治第十三：小便不利，蒲灰散主之。
  needs: [
    ['urination_difficulty.yes', 'hematuria.yes'],
    ['urination_difficulty.yes', 'lower_abdomen_cramp.yes']
  ],
  contraindications: ['治湿热夹瘀的小便不利、尿中带血', '只有两味：蒲灰（蒲黄炒黑，凉血化瘀止血）、滑石（清热利水通淋）', '蒲黄既能化瘀又能止血，是「止血不留瘀」的典型药', '与同条的滑石白鱼散、茯苓戎盐汤是**并列备选**，原文说「并主之」——临床按兼证选用，不是同时吃']
}
