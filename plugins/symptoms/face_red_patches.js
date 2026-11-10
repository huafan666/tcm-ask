module.exports = {
  name: 'face_red_patches',
  title: '脸上红斑如锦纹',
  trigger(text) { return ['脸上红斑', '面部红斑', '脸上红一块一块', '脸上起红斑', '脸上斑斑发红', '面上红斑成片', '脸上红片片', '一片片红斑', '脸上红斑成片', '红斑像花纹', '面红斑斑'].some(k => text.includes(k)) },
  negate(text) { return ['脸上没有红斑', '脸上干干净净'].some(k => text.includes(k)) },
  ask: '是不是脸上有一片一片的红斑，花纹样、红得不均匀？'
}
