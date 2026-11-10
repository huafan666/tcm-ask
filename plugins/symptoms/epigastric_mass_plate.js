module.exports = {
  name: 'epigastric_mass_plate',
  title: '心口下有一块像盘子大的硬结',
  trigger(text) { return ['心口下有一块像盘子大的硬结', '心下坚大如盘', '心口摸着硬一块像盘子', '胃下面有硬块像倒扣的杯', '心口下盘大一块硬结', '心下硬块边像杯口'].some(k => text.includes(k)) },
  negate(text) { return ['心口下没有硬块'].some(k => text.includes(k)) },
  ask: '是不是心口下面能摸到一块硬结，有盘子那么大、边缘像倒扣的杯子？'
}
