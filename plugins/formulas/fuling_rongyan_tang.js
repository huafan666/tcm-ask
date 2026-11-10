module.exports = {
  name: 'fuling_rongyan_tang',
  title: '茯苓戎盐汤',
  kind: 'formula',
  // 金匮要略·消渴小便不利淋病脉证并治第十三：小便不利……茯苓戎盐汤并主之。
  needs: [
    ['urination_difficulty.yes', 'thirsty.no'],
    ['urination_difficulty.yes', 'body_heavy.yes']
  ],
  contraindications: ['与蒲灰散、滑石白鱼散并列，同治小便不利，但偏「脾虚湿停」这一路', '三味：茯苓（利水健脾）、白术（燥湿健脾）、戎盐（即青盐，咸味软坚引水下行）', '和栝蒌瞿麦丸的鉴别：**本方不渴**（湿停而无燥热）；栝蒌瞿麦丸是「其人若渴」', '原文服法是「先将茯苓、白术煎成，入戎盐再煎，分温三服」']
}
