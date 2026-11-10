module.exports = {
  name: 'gegen_huangqin_huanglian_tang',
  title: '葛根黄芩黄连汤',
  kind: 'formula',
  // 34条：太阳病，桂枝证，医反下之，利遂不止。脉促者，表未解也，喘而汗出者，葛根黄芩黄连汤主之。
  needs: ['diarrhea.yes', 'chuan.yes', 'sweat.yes'],
  contraindications: ['34条：桂枝证误下后，利遂不止，喘而汗出', '葛根解表、芩连清里——表里双解', '与葛根汤的区别：葛根汤是无汗（表实），本方是汗出而喘（里热已起）', '与麻杏石甘汤的区别：本方必有下利，麻杏石甘没有']
}
