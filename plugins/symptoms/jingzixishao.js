module.exports = {
  name: 'jingzixishao',
  title: '精子稀少',
  trigger(text) { return ['精子不多', '精液量不多', '精子稀'].some(k => text.includes(k)) },
  ask: '是不是检查说精液量少、精子少？'
}
