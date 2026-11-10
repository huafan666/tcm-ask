module.exports = {
  name: 'chest_indescribable',
  title: '胸中说不出的难受',
  trigger(text) { return ['胸中说不出的难受', '似喘不喘似呕不呕', '心里烦乱说不清', '胸中愦愦然', '说不上来的难受', '心里乱得没办法', '胸口堵得说不出什么感觉'].some(k => text.includes(k)) },
  negate(text) { return ['胸中舒服'].some(k => text.includes(k)) },
  ask: '是不是胸口里有一种说不清的难受——像喘又不是喘、想吐又吐不出、想打嗝又打不出？'
}
