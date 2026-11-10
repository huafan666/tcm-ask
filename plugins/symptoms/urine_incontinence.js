module.exports = {
  name: 'urine_incontinence',
  title: '小便控制不住',
  trigger(text) { return ['小便控制不住', '遗尿', '尿裤子', '憋不住尿', '不知不觉尿出来', '小便失禁', '尿失禁', '控制不住小便', '不知不觉尿了'].some(k => text.includes(k)) },
  negate(text) { return ['小便能控制'].some(k => text.includes(k)) },
  ask: '是不是小便憋不住、有时不知不觉就尿出来了？'
}
