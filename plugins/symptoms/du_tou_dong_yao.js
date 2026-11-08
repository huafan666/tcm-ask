module.exports = {
  name: 'du_tou_dong_yao',
  title: '独头动摇',
  trigger(text) { return ['独头动摇', '头不停摇晃', '头自己晃', '头一直晃', '头不由自主地摇'].some(k => text.includes(k)) },
  negate(text) { return ['头不摇', '头不晃'].some(k => text.includes(k)) },
  ask: '是不是头会自己不停地摇晃，旁边人都看得出你在晃头？'
}
