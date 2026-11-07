module.exports = {
  name: 'taohua_tang',
  title: '桃花汤',
  kind: 'formula',
  // 第306/307条: 少阴病下利便脓血/腹痛小便不利下利不止便脓血者桃花汤主之。
  // 少阴虚寒便脓血(下利+便脓血)。核心=下利+便脓血。用赤石脂涩肠。
  needs: [
    ['diarrhea.yes', 'blood_pus_stool.yes']
  ],
  contraindications: ['下利+便脓血(少阴虚寒)', '涩肠固脱(赤石脂干姜粳米)', '虚寒滑脱而非实热便血']
}
