module.exports = {
  name: 'fei_wei',
  title: '肺痿',
  kind: 'summary',
  // 金匮要略·肺痿肺痈咳嗽上气病脉证并治第七：热在上焦者，因咳为肺痿……重亡津液，故得之……肺痿吐涎沫而不咳者，其人不渴，必遗尿，小便数。
  needs: [
    ['cough.yes', 'saliva_spit.yes'],
    ['saliva_spit.yes', 'thirsty.no', 'urine_incontinence.yes'],
    ['saliva_spit.yes', 'frequent_urination.yes']
  ],
  contraindications: ['肺痿是肺叶「痿弱不用」——肺的功能虚衰了，不是实证', '典型表现：咳、吐出浊唾涎沫；虚寒型的甚至不太咳、口不渴、还遗尿、小便次数多', '成因原文说得很清楚：汗出太多、呕吐、消渴小便多、便秘又误用泻药，这几种都在「重亡津液」，津液伤透了肺就痿了', '虚寒型（肺中冷）用甘草干姜汤温肺；虚热型是麦门冬汤的方向', '和肺痈的区别：肺痿吐的是清稀涎沫，肺痈吐的是腥臭脓痰']
}
