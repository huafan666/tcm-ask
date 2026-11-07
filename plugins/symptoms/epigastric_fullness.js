module.exports = {
  name: 'epigastric_fullness',
  title: '心下满',
  kind: 'symptom',
  trigger(text) { return ['心下满', '胃脘胀', '心口堵', '心下胀满', '上腹胀'].some(k => text.includes(k)) },
  negate(text) { return ['心下不胀'].some(k => text.includes(k)) }
}
