module.exports = {
  name: 'banxia_san_ji_tang',
  title: '半夏散及汤',
  kind: 'formula',
  // 313条：少阴病，咽中痛，半夏散及汤主之。
  needs: ['throat_pain.yes', 'cold_aversion.yes', 'throat_ulcer.no'],
  contraindications: ['313条：少阴病，咽中痛', '半夏、桂枝、甘草三味，散寒通阳、涤痰利咽——治的是**寒客少阴**的咽痛', '与甘草汤/桔梗汤的区别：那两个偏客热咽痛、无寒象；本方必见恶寒等寒象', '与苦酒汤的区别：苦酒汤治咽中生疮、声不出，本方无疮', '散、汤两用：不能服散者作汤']
}
