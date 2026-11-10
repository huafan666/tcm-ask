module.exports = {
  name: 'zeqi_tang',
  title: '泽漆汤',
  kind: 'formula',
  // 金匮要略·肺痿肺痈咳嗽上气病脉证并治第七：脉沉者，泽漆汤主之。
  needs: [
    ['cough.yes', 'orthopnea.yes'],
    ['cough.yes', 'chest_fullness.yes', 'frequent_urination.yes']
  ],
  contraindications: ['治水饮内停、病位偏里（原文以「脉沉」定位，脉象按口径不入条件）', '泽漆逐水消肿为君，配半夏、生姜、桂枝、紫参、白前、甘草、人参——逐水同时护正', '原文用东流水先煮泽漆取汁再煎他药，取长流水助下行之性']
}
