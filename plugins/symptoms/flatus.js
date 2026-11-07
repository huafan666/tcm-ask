module.exports = {
  name: 'flatus',
  title: '放屁/转矢气',
  kind: 'symptom',
  trigger(text) { return ['放屁', '转矢气', '矢气', '有屁放', '排气', '爱放屁', '能放屁', '屁多'].some(k => text.includes(k)) },
  negate(text) { return ['不放屁', '没有屁', '无矢气', '不排气', '没屁放'].some(k => text.includes(k)) },
  ask: '会不会放屁？放屁说明气还能通(大便在小肠未深结)→用轻的小承气；几天不排气+按左腹痛→燥屎硬结用大承气。'
}
