module.exports = {
  name: 'gualou_muli_san',
  title: '栝楼牡蛎散',
  kind: 'formula',
  // 金匮要略·百合病狐惑阴阳毒病证并治第三：百合病，渴不差者，用后方主之（栝楼牡蛎散）。
  needs: ['baihe_bing.yes', 'thirsty.yes', 'severe_thirst.yes'],
  contraindications: ['百合病口渴一直不好、喝很多水也不解，用百合洗方也没解决，就换这个内服', '栝楼根（天花粉）生津止渴，牡蛎咸寒潜降、把浮上去的热往下收', '两味等分为末，每次一小勺（方寸匕）用水送服，一天三次', '和百合洗方（3.6）是先后两步：3.6 是刚变渴、走外洗透邪；本条是渴得厉害、津伤已深，必须内服生津']
}
