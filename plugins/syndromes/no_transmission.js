module.exports = {
  name: 'no_transmission',
  title: '不传',
  kind: 'summary',
  // 第4条: 伤寒一日太阳受之，脉静者不传，颇欲吐/躁烦/脉数急者为传。
  // 暂不做脉，去掉rapid_pulse.no(脉静)，用 太阳之为病 + 不吐 + 不躁烦。
  needs: ['taiyang_disease.yes', 'vomiting.no', 'restless.no']
}

