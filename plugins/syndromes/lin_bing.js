module.exports = {
  name: 'lin_bing',
  title: '淋病',
  kind: 'summary',
  // 金匮要略·消渴小便不利淋病脉证并治第十三：淋之为病，小便如粟状，小腹弦急，痛引脐中。
  needs: [
    ['urine_gravel.yes', 'lower_abdomen_cramp.yes'],
    ['urine_gravel.yes', 'circumumbilical_pain.yes'],
    ['urine_gravel.yes']
  ],
  contraindications: ['中医的「淋病」指**小便淋沥涩痛**的一类病（石淋、气淋、膏淋、劳淋等），**不是**现代医学所指的性传播疾病淋病，两者名同实异', '本条给出的表现：小便像粟粒、小腹弦急（发紧拘急）、疼痛牵引到肚脐', '石淋（尿路结石）的典型表现就是尿中排出砂石样物', '原文另有一句禁忌：「淋家不可发汗，发汗则必便血」——淋病多属下焦湿热、阴液已伤，再发汗会更伤阴动血', '⚠ 尿中有砂石、腰痛剧烈、血尿的，建议做泌尿系超声明确结石']
}
