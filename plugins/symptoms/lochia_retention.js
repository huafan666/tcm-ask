module.exports = {
  name: 'lochia_retention',
  title: '产后恶露排不干净',
  trigger(text) { return ['恶露排不干净', '恶露不尽', '产后恶露一直不干净', '产后下血淋漓不断', '恶露拖很久', '产后血没排干净'].some(k => text.includes(k)) },
  negate(text) { return ['恶露正常'].some(k => text.includes(k)) },
  ask: '是不是产后恶露（下血）一直排不干净？'
}
