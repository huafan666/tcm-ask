module.exports = {
  name: 'xiao_ke',
  title: '消渴',
  kind: 'summary',
  // 金匮要略·消渴小便不利淋病脉证并治第十三：厥阴之为病，消渴，气上冲心，心中疼热，饥而不欲食……男子消渴，小便反多，以饮一斗，小便一斗。
  needs: [
    ['thirsty.yes', 'polyuria.yes'],
    ['polyphagia.yes', 'constipation.yes', 'frequent_urination.yes'],
    ['qi_surge.yes', 'hungry.yes', 'low_appetite.yes'],
    ['thirsty.yes', 'frequent_urination.yes']
  ],
  contraindications: ['消渴的核心是「喝得多、尿得多、吃得多但人消瘦」，中医认为病机是阴虚燥热', '分上中下三消：上消多饮（肺）、中消多食（胃）、下消多尿（肾）', '原文有两句很关键：一是「饮一斗，小便一斗」——喝多少尿多少，肾气不固；二是「消谷引食，大便必坚，小便即数」——吃得多、大便干、尿频，是胃热', '厥阴型的消渴还伴「气上冲心、心中疼热、饥而不欲食、食即吐」（像 13.1 描述的那样）', '⚠ 现代医学的糖尿病属于消渴范畴，但消渴不等于糖尿病；确诊要看血糖，不能只凭症状']
}
