module.exports = {
  name: 'sini_xiaobaisan',
  title: '三物小白散',
  kind: 'formula',
  // 第141条: 寒实结胸，无热证者，与三物小陷胸汤、白散亦可服。
  // 寒实结胸(无热象). 核心=结胸而无热证。
  needs: [
    ['press_only_pain.yes', 'fever.no']
  ],
  contraindications: ['寒实结胸无热证', '温下寒实(巴豆)', '病在膈上必吐、膈下必利']
}
