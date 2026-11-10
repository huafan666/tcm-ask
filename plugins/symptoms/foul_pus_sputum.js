module.exports = {
  name: 'foul_pus_sputum',
  title: '吐腥臭浊痰脓痰',
  trigger(text) { return ['吐腥臭浊痰', '痰有腥臭味', '吐脓痰', '痰像米粥一样', '咳出腥臭的痰', '吐浊唾腥臭', '咳脓痰带臭味', '痰又稠又臭', '痰腥臭', '吐腥臭痰', '咳出臭痰', '痰像米汤'].some(k => text.includes(k)) },
  negate(text) { return ['痰不臭'].some(k => text.includes(k)) },
  ask: '是不是咳出来的痰又稠又浊，还有腥臭味，甚至像米粥、脓一样？'
}
