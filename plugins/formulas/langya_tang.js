module.exports = {
  name: 'langya_tang',
  title: '狼牙汤',
  kind: 'formula',
  // 金匮要略·妇人杂病脉证并治第二十二：少阴脉滑而数者，阴中即生疮，阴中蚀疮烂者，狼牙汤洗之。
  needs: [
    ['genital_ulcer.yes'],
    ['genital_ulcer.yes', 'vaginal_discharge.yes']
  ],
  contraindications: ['治**阴中生疮、溃烂**（外阴阴道溃疡），用狼牙汤**外洗**', '狼牙（即狼牙草，一说为仙鹤草根芽）三味煎汤，「以绵缠箸头，沥汤洗之，日四遍」', '⚠ **外洗方，不可内服**；狼牙有毒，用量须严格控制', '⚠ 外阴溃疡要查明原因：单纯疱疹、梅毒、白塞病、外阴癌等都可能表现为溃疡，必须专科检查']
}
