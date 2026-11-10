module.exports = {
  name: 'periodic_chill_fever',
  title: '定时发冷发热',
  trigger(text) { return ['定时发冷发热', '每天定时发冷发热', '隔一天发冷发热', '隔天发作一次', '按时发冷发热', '固定时间发冷发热', '周期性发冷发热', '打摆子', '定时打摆子', '到点就发冷发热', '每隔一天犯一次', '隔两三天犯一次'].some(k => text.includes(k)) },
  negate(text) { return ['不发冷了', '已经不发作了'].some(k => text.includes(k)) },
  ask: '是不是发冷发热有固定规律，比如每天、隔一天或者隔两三天就准点发作一次？'
}
