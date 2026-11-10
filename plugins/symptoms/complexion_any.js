module.exports = {
  name: 'complexion_any',
  title: '面色/肤色异常',
  kind: 'symptom_group',
  // 症状筛选组（部位）：面色/肤色异常
  trigger(text) { return ['面色', '脸色', '气色', '肤色'].some(k => text.includes(k)) },
  ask: '是不是脸色、皮肤颜色不对——发青、发黄、发黑、发白、发红或者忽变？',
  children: ['face_black', 'face_blue', 'face_pale', 'face_yellow', 'face_red_patches', 'face_color_fluctuating', 'mian_chi', 'poor_complexion', 'forehead_dark', 'jaundice'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：部位｜未归入本组的：局部发黑（眼眶、额头已单列但也可归此）；斑疹、疮疡']
}
