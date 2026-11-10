module.exports = {
  name: 'zhizi_ganjiang_tang',
  title: '栀子干姜汤',
  kind: 'formula',
  // 第80条: 伤寒医以丸药大下之，身热不去，微烦者，栀子干姜汤主之。
  // 上热下寒(热在上身烦、中寒)。核心=微烦。
  needs: ['restless.yes', 'fever.yes', 'cold_aversion.no'],
  contraindications: ['大下之后身热不去微烦', '上热(栀)下寒(干姜)', '得吐者止后服']
}
