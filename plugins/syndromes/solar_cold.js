module.exports = {
  name: 'solar_cold',
  title: '太阳伤寒',
  kind: 'summary',
  // 第3条: 太阳病，或已发热或未发热，必恶寒，体痛，呕逆，脉阴阳俱紧者，名为伤寒。
  // 发热可有可无(不进 needs)。暂不做脉，故去掉脉紧；待做脉后加回。
  needs: ['cold_aversion.yes', 'body_pain.yes', 'vomiting.yes']
}

