module.exports = {
  name: 'yaotuisuankun',
  title: '腰腿酸困',
  trigger(text) { return ['腰酸困', '腿酸困', '腿困', '腰困'].some(k => text.includes(k)) },
  ask: '是不是腰和腿又酸又困、发沉，还怕冷？'
}
