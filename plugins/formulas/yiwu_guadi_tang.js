module.exports = {
  name: 'yiwu_guadi_tang',
  title: '一物瓜蒂汤',
  kind: 'formula',
  // 金匮要略·痉湿暍病脉证并治第二：太阳中暍，身热疼重，而脉微弱，此以夏月伤冷水，水行皮中所致也，一物瓜蒂汤主之。
  needs: ['fever.yes', 'body_aches_heavy.yes'],
  contraindications: ['暑令伤于冷水、水湿郁于肌表：身热而疼重', '与白虎加人参汤（暍病津伤）区别：本方是水湿在表、无大渴大汗', '与瓜蒂散（痰涎在胸、寸脉微浮）是完全不同的两张方，不要混', '脉微弱属虚，瓜蒂汤取吐法，须慎']
}
