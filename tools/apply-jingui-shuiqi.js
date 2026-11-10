'use strict'
// tools/apply-jingui-shuiqi.js
// 金匮批 16：第十四篇 水气病脉证并治（14.1 ~ 14.41）
//
// 口径同前几批：白话优先、要素按事实、AND 只放关键症状、病机进 contraindications、脉象一律不做。
// 本篇脉象与病机条极多：14.10~14.16、14.22~14.26、14.34、14.36、14.41 → 不落节点
// 14.17~14.21 五脏水是病机描述（原文无方）→ 不落节点
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH14 = '金匮要略·水气病脉证并治第十四'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'pitting_edema',
    title: '按下去一个坑不起',
    kind: 'symptom',
    comment: CH14 + '：皮水……胕肿，按之没指……按其手足上，陷而不起者，风水。',
    trigger: ['按下去一个坑', '按之没指', '一按一个坑', '按下去起不来', '腿上按下去有坑',
      '肿得按出坑', '凹陷性水肿', '按下陷进去不起来'],
    negate: ['按下去没有坑'],
    ask: '是不是身上肿，用手一按就陷下去一个坑，好一会儿都起不来？'
  },
  {
    name: 'eyelid_puffy',
    title: '眼泡浮肿像卧蚕',
    kind: 'symptom',
    comment: CH14 + '：视人之目窠上微拥，如蚕新卧起状……夫水病人，目下有卧蚕。',
    trigger: ['眼泡浮肿', '眼皮肿得像卧蚕', '目下有卧蚕', '早上起来眼泡肿', '眼睛下面肿起来',
      '眼袋肿得亮', '眼下肿得像蚕'],
    negate: ['眼泡不肿'],
    ask: '是不是眼睛下面（眼泡）浮肿起来，像一条卧着的蚕？'
  },
  {
    name: 'duck_stool',
    title: '大便稀溏像鸭粪',
    kind: 'symptom',
    comment: CH14 + '：肺水者，其身肿，小便难，时时鸭溏（鸭溏：水粪夹杂、稀而不爽）。',
    trigger: ['大便像鸭粪', '鸭溏', '拉稀水粪混杂', '大便稀而不爽', '大便溏薄水样',
      '拉的像鸭屎'],
    negate: ['大便成形'],
    ask: '是不是大便稀溏、水和粪混在一起，像鸭粪那样？'
  },
  {
    name: 'waist_split_sweat',
    title: '腰以上出汗、腰以下不出',
    kind: 'symptom',
    comment: CH14 + '：又从腰以上必汗出，下无汗，腰髋弛痛。',
    trigger: ['腰以上出汗腰以下不出', '上半身出汗下半身没汗', '只有上半身出汗',
      '腰以下不出汗', '上半身有汗下半身干'],
    negate: ['全身出汗均匀'],
    ask: '是不是只有腰以上出汗，腰以下一点汗都没有？'
  },
  {
    name: 'scrotal_edema',
    title: '下身阴部水肿',
    kind: 'symptom',
    comment: CH14 + '：心水者……其人阴肿；肾水者……阴下湿如牛鼻上汗。',
    trigger: ['阴部水肿', '阴囊肿', '下身肿', '阴部湿漉漉', '阴下湿如牛鼻汗',
      '生殖器周围水肿'],
    negate: ['阴部不肿'],
    ask: '是不是下身（阴部、阴囊）也肿了，还总是湿漉漉的？'
  }
]

// ---------- 证候 6 个（五水 + 气分）----------
const SUMMARIES = [
  {
    name: 'feng_shui',
    title: '风水',
    kind: 'summary',
    comment: CH14 + '：风水其脉自浮，外证骨节疼痛，恶风……面目肿大，有热，名曰风水。',
    needs: [
      // 浮肿 + 怕风（风水与皮水的关键区别就是「恶风」）
      ['pitting_edema.yes', 'wind_aversion.yes'],
      // 眼泡浮肿 + 怕风
      ['eyelid_puffy.yes', 'wind_aversion.yes'],
      // 浮肿 + 关节痛 + 怕风
      ['pitting_edema.yes', 'joint_pain_rigid.yes', 'wind_aversion.yes']
    ],
    contraindications: [
      '五水之一。风水是风邪袭表、肺气不宣，水湿泛溢到肌表',
      '原文定义：脉浮、骨节疼痛、**恶风**——「恶风」是风水区别于皮水的关键',
      '常见起病方式：先有外感，然后突然眼泡肿、脸肿，接着全身肿',
      '治法「当发其汗」——水在表就从表解',
      '⚠ 眼泡肿、血尿、血压高的组合要警惕急性肾炎，建议查尿常规'
    ],
    ref: CH14 + ' · 风水其脉自浮，外证骨节疼痛，恶风'
  },
  {
    name: 'pi_shui',
    title: '皮水',
    kind: 'summary',
    comment: CH14 + '：皮水其脉亦浮，外证胕肿，按之没指，不恶风，其腹如鼓，不渴，当发其汗。',
    needs: [
      // 凹陷性水肿 + 不怕风（与风水的关键区别）
      ['pitting_edema.yes', 'wind_aversion.no'],
      // 凹陷性水肿 + 不渴
      ['pitting_edema.yes', 'thirsty.no'],
      // 凹陷性水肿 + 肚子胀如鼓
      ['pitting_edema.yes', 'abdominal_fullness.yes']
    ],
    contraindications: [
      '五水之一。皮水是水湿停在皮肤肌腠之间',
      '原文定义：脉浮、**胕肿按之没指**（按下去一个坑）、**不恶风**、腹如鼓、**不渴**',
      '与风水的关键区别就在「不恶风」——皮水没有外感表证，是纯粹的水湿',
      '治法同样是「当发其汗」',
      '「不渴」也是鉴别点：口渴说明津液已伤，就不宜单纯发汗'
    ],
    ref: CH14 + ' · 皮水其脉亦浮，外证胕肿，按之没指，不恶风，其腹如鼓，不渴，当发其汗'
  },
  {
    name: 'zheng_shui',
    title: '正水',
    kind: 'summary',
    comment: CH14 + '：正水其脉沉迟，外证自喘……属少阴（肾）。',
    needs: [
      // 水肿 + 喘（正水是肾阳虚水泛，水气上凌于肺）
      ['pitting_edema.yes', 'orthopnea.yes'],
      ['pitting_edema.yes', 'short_breath.yes'],
      ['pitting_edema.yes', 'polyuria.no']
    ],
    contraindications: [
      '五水之一。正水是肾阳虚、不能化气行水，水湿泛滥全身',
      '原文定义：**脉沉迟**、**外证自喘**——「自喘」说明水气已经上凌于肺，是本证的重点',
      '病位在少阴（肾），本质是阳虚，不是单纯水多',
      '和风水、皮水的区别：风水皮水病位在表，脉浮；正水病位在里（肾），脉沉',
      '⚠ 全身水肿 + 喘 + 尿少的组合，要查心功能和肾功能'
    ],
    ref: CH14 + ' · 正水其脉沉迟，外证自喘'
  },
  {
    name: 'shi_shui',
    title: '石水',
    kind: 'summary',
    comment: CH14 + '：石水其脉自沉，外证腹满不喘。',
    needs: [
      // 腹满 + 水肿 + 不喘（与正水的关键区别）
      ['abdominal_fullness.yes', 'pitting_edema.yes', 'short_breath.no'],
      ['abdominal_fullness.yes', 'pitting_edema.yes', 'urination_difficulty.yes']
    ],
    contraindications: [
      '五水之一。石水是水气结在下焦，坚硬如石，所以叫「石水」',
      '原文定义：脉沉、**腹满**、**不喘**',
      '与正水的关键区别就在「不喘」——正水水气上凌于肺所以喘，石水结在下焦所以不喘',
      '病位偏下焦肝肾，以腹部胀满为主',
      '⚠ 腹水明显、腹壁静脉曲张的，要警惕肝硬化腹水等，须做影像和肝功能检查'
    ],
    ref: CH14 + ' · 石水其脉自沉，外证腹满不喘'
  },
  {
    name: 'huang_han',
    title: '黄汗',
    kind: 'summary',
    comment: CH14 + '：黄汗之为病，身体肿，发热汗出而渴，状如风水，汗沾衣，色正黄如柏汁……以汗出入水中浴，水从汗孔入得之。',
    needs: [
      // 出黄汗 + 身体肿（黄汗最特异的组合）
      ['yellow_sweat.yes', 'pitting_edema.yes'],
      ['yellow_sweat.yes', 'body_heavy.yes'],
      // 黄汗 + 腰以上出汗腰以下无汗
      ['yellow_sweat.yes', 'waist_split_sweat.yes'],
      ['yellow_sweat.yes', 'lower_leg_cold.yes']
    ],
    contraindications: [
      '五水之一（也算独立一病）。特征是**汗出色黄如柏汁**，把内衣染黄，同时身体浮肿',
      '原文的病因说得很具体：「以汗出入水中浴，水从汗孔入得之」——出汗时下水、水从汗孔侵入',
      '还常伴两胫自冷、腰以上出汗而下无汗、身体疼重、烦躁',
      '与黄疸的区别：黄汗是**汗黄**，黄疸是**身目尿黄**（皮肤眼睛发黄）',
      '⚠ 汗色发黄要先排除肝胆疾病引起的黄疸，也要注意是否与饮食、药物、汗液成分有关'
    ],
    ref: CH14 + ' · 黄汗之为病，身体肿，发热汗出而渴……汗沾衣，色正黄如柏汁'
  },
  {
    name: 'qi_fen',
    title: '气分',
    kind: 'summary',
    comment: CH14 + '：气分，心下坚，大如盘，边如旋杯，水饮所作，桂枝去芍药加麻辛附子汤主之。心下坚，大如盘，边如旋盘，水饮所作，枳术汤主之。',
    needs: [
      // 心口下面有硬块像盘子一样大 —— 气分最特异的体征
      ['epigastric_mass_plate.yes'],
      ['epigastric_mass_plate.yes', 'abdominal_fullness.yes'],
      ['epigastric_mass_plate.yes', 'pitting_edema.yes']
    ],
    contraindications: [
      '气分是水气与寒气互结在气分，导致阳气不通',
      '最形象的表现：**心下坚，大如盘，边如旋杯/旋盘**——心口下面有一块硬结，有盘子那么大、边缘像倒扣的杯子',
      '和积聚的区别：气分以「水气」为本，多伴水肿；用药也是通阳化气利水，不是攻瘀',
      '两个方一虚一实：桂枝去芍药加麻辛附子汤偏阳虚寒凝，枳术汤偏气滞水停',
      '原文还说「水饮所作」——明确这是水饮造成的'
    ],
    ref: CH14 + ' · 气分，心下坚，大如盘，边如旋杯，水饮所作'
  }
]

// 气分需要的症状（同批新建）
const EXTRA_SYMPTOMS = [
  {
    name: 'epigastric_mass_plate',
    title: '心口下有一块像盘子大的硬结',
    kind: 'symptom',
    comment: CH14 + '：心下坚，大如盘，边如旋杯（水饮结聚成块）。',
    trigger: ['心口下有一块像盘子大的硬结', '心下坚大如盘', '心口摸着硬一块像盘子',
      '胃下面有硬块像倒扣的杯', '心口下盘大一块硬结', '心下硬块边像杯口'],
    negate: ['心口下没有硬块'],
    ask: '是不是心口下面能摸到一块硬结，有盘子那么大、边缘像倒扣的杯子？'
  }
]

// ---------- 方剂 10 个新建 ----------
const FORMULAS = [
  {
    name: 'yuebi_jia_zhu_tang',
    title: '越婢加术汤',
    kind: 'formula',
    comment: CH14 + '：里水者，一身面目黄肿，其脉沉，小便不利……越婢加术汤主之。里水，越婢加术汤主之。',
    needs: [
      // 全身面目肿 + 小便不利
      ['pitting_edema.yes', 'urination_difficulty.yes'],
      ['eyelid_puffy.yes', 'urination_difficulty.yes']
    ],
    contraindications: [
      '治里水（一身面目黄肿、小便不利）',
      '越婢汤（麻黄、石膏、生姜、大枣、甘草）+ 白术——麻黄宣肺发汗、石膏清郁热、白术健脾除湿',
      '一面从表散水、一面从里健脾，适合表里同病的水肿',
      '原文另有一句重要鉴别：「假如小便自利，此亡津液，故令渴也」——小便如果通畅还渴，那是津液已伤，不是水停'
    ],
    ref: CH14 + ' · 里水者，一身面目黄肿，其脉沉，小便不利……越婢加术汤主之'
  },
  {
    name: 'yuebi_tang',
    title: '越婢汤',
    kind: 'formula',
    comment: CH14 + '：风水恶风，一身悉肿，脉浮不渴，续自汗出，无大热，越婢汤主之。',
    needs: [
      // 一身悉肿 + 怕风 + 出汗
      ['pitting_edema.yes', 'wind_aversion.yes', 'sweat.yes'],
      ['pitting_edema.yes', 'wind_aversion.yes', 'thirsty.no']
    ],
    contraindications: [
      '治风水：全身都肿、怕风、不停地自己出汗、不渴、没有明显高热',
      '五味：麻黄（重用六两）、石膏、生姜、大枣、甘草',
      '关键在「续自汗出」还照用麻黄——因为有肿、要宣肺利水，汗出是表虚不是禁汗的依据',
      '「不渴」说明里无热盛，「无大热」说明热不重',
      '和防己黄芪汤区别：那条是汗出恶风但以「身重、脉浮」为主，偏气虚；本条以「一身悉肿」为主'
    ],
    ref: CH14 + ' · 风水恶风，一身悉肿，脉浮不渴，续自汗出，无大热，越婢汤主之'
  },
  {
    name: 'fangji_fuling_tang',
    title: '防己茯苓汤',
    kind: 'formula',
    comment: CH14 + '：皮水为病，四肢肿，水气在皮肤中，四肢聂聂动者，防己茯苓汤主之。',
    needs: [
      // 四肢肿 + 肌肉轻微跳动（聂聂动）
      ['pitting_edema.yes', 'muscle_twitching.yes'],
      ['pitting_edema.yes', 'limb_heavy_powerless.yes']
    ],
    contraindications: [
      '治皮水：四肢浮肿，水气在皮肤中，还伴**四肢聂聂动**（肌肉轻微跳动）',
      '「聂聂动」是水气在皮中、阳气被郁的表现，是本方最特异的指征',
      '防己、黄芪、桂枝、茯苓、甘草——通阳化气、利水消肿',
      '和防己黄芪汤区别：防己黄芪汤是风水表虚汗出，本方是皮水四肢肿而水在皮中'
    ],
    ref: CH14 + ' · 皮水为病，四肢肿，水气在皮肤中，四肢聂聂动者，防己茯苓汤主之'
  },
  {
    name: 'gancao_mahuang_tang',
    title: '甘草麻黄汤',
    kind: 'formula',
    comment: CH14 + '：里水，越婢加术汤主之；甘草麻黄汤亦主之。',
    needs: [
      // 水肿 + 无汗（纯粹的表实无汗，用麻黄发汗）
      ['pitting_edema.yes', 'no_sweat.yes'],
      ['pitting_edema.yes', 'no_sweat.yes', 'fever.no']
    ],
    contraindications: [
      '治里水而无汗者，是发汗的极简方',
      '只有两味：甘草、麻黄。麻黄发汗宣肺利水，甘草和中',
      '「里水」在《金匮》里也叫「皮水」，指水在皮肤肌腠之间',
      '和越婢加术汤的区别：本方纯属表实无汗，没有热象（无石膏）；有热象用越婢加术汤',
      '原文服法「温服一升，重复汗出，不汗再服，慎风寒」——以出汗为度，注意避风'
    ],
    ref: CH14 + ' · 里水，越婢加术汤主之；甘草麻黄汤亦主之'
  },
  {
    name: 'mahuang_fuzi_tang',
    title: '麻黄附子汤',
    kind: 'formula',
    comment: CH14 + '：水之为病，其脉沉小，属少阴……脉沉者宜麻黄附子汤。',
    needs: [
      // 水肿 + 脉沉属少阴（阳虚）——用「怕冷/四肢凉」承接阳虚
      ['pitting_edema.yes', 'cold_extremities.yes'],
      ['pitting_edema.yes', 'cold_aversion.yes', 'no_sweat.yes']
    ],
    contraindications: [
      '治水气病属少阴（肾阳虚）者：水肿而脉沉小',
      '即麻黄附子甘草汤（麻黄、附子、甘草）——温经发汗，助阳散水',
      '和甘草麻黄汤的区别：本方有附子，针对**阳虚**；纯表实无汗才用甘草麻黄汤',
      '附子有毒须炮制久煎',
      '原文强调「水，发其汗即已」——但阳虚的水肿发汗必须配温阳，不能单用麻黄'
    ],
    ref: CH14 + ' · 水之为病，其脉沉小，属少阴……脉沉者宜麻黄附子汤'
  },
  {
    name: 'xingzi_tang',
    title: '杏子汤',
    kind: 'formula',
    comment: CH14 + '：浮者为风……浮者宜杏子汤。（原方未见，后世多认为即麻黄杏仁甘草石膏汤或杏子散类）',
    needs: [
      // 水肿 + 脉浮属风（用「怕风」承接表证）
      ['pitting_edema.yes', 'wind_aversion.yes', 'sweat.no']
    ],
    contraindications: [
      '治水气病而脉浮属风者',
      '**原方已佚**：《金匮》只留方名，未见药物组成。后世有认为是麻黄杏仁甘草石膏汤，也有认为是杏子散等，说法不一',
      '本条与麻黄附子汤是同一句里的对照：脉沉属少阴用麻黄附子汤，脉浮属风用杏子汤',
      '⚠ 因原方组成不确定，实际用药须由医师据证拟定，不可照此方自行抓药'
    ],
    ref: CH14 + ' · 浮者为风……浮者宜杏子汤（方佚）'
  },
  {
    name: 'qishao_guijiu_tang',
    title: '芪芍桂酒汤（耆芍桂酒汤）',
    kind: 'formula',
    comment: CH14 + '：黄汗之为病，身体肿，发热汗出而渴，状如风水，汗沾衣，色正黄如柏汁……宜耆芍桂酒汤主之。',
    needs: [
      // 出黄汗 + 身体肿 —— 黄汗的定性组合
      ['yellow_sweat.yes', 'pitting_edema.yes'],
      ['yellow_sweat.yes', 'sweat.yes', 'thirsty.yes']
    ],
    contraindications: [
      '治黄汗：汗出色黄如柏汁、染黄衣服，身体浮肿，发热汗出而渴',
      '三味：黄芪（益气固表）、芍药（和营）、桂枝（通阳），加苦酒（醋）同煎',
      '苦酒（醋）的作用是「以酸收之」，助药力入营分、敛汗',
      '原文服法：「温服一升，当心烦，服至六七日乃解。若心烦不止者，以苦酒阻故也」——' +
      '服药后心烦是正常反应，六七天自解',
      '⚠ 汗色发黄须先排除黄疸（查肝功能、胆红素）'
    ],
    ref: CH14 + ' · 宜耆芍桂酒汤主之（黄芪五两、芍药三两、桂枝三两，苦酒一升）'
  },
  {
    name: 'guizhi_jia_huangqi_tang',
    title: '桂枝加黄芪汤',
    kind: 'formula',
    comment: CH14 + '：若身重，汗出已辄轻者，久久必身瞤，瞤即胸中痛，又从腰以上必汗出，下无汗，腰髋弛痛……此为黄汗，桂枝加黄芪汤主之。',
    needs: [
      // 腰以上出汗腰以下无汗 + 身体重
      ['waist_split_sweat.yes', 'body_heavy.yes'],
      ['waist_split_sweat.yes', 'yellow_sweat.yes'],
      ['yellow_sweat.yes', 'muscle_twitching.yes', 'chest_stuffy.yes']
    ],
    contraindications: [
      '治黄汗而阳气不足、表虚不固者',
      '桂枝汤（调和营卫）+ 黄芪（益气固表）',
      '原文描述很细：身体重、出汗后反而轻快、久了会肌肉跳动、跳动就胸中痛；' +
      '**腰以上出汗、腰以下无汗**，腰髖松弛作痛，像有东西在皮肤里',
      '和芪芍桂酒汤区别：芪芍桂酒汤偏营分郁热（汗黄如柏汁、渴），本方偏表虚阳气不足（汗出色淡、腰上汗下无汗）',
      '严重时「不能食，身疼重，烦躁，小便不利」'
    ],
    ref: CH14 + ' · 此为黄汗，桂枝加黄芪汤主之（桂枝汤加黄芪二两）'
  },
  {
    name: 'guizhi_qu_shaoyao_jia_maxin_fuzi_tang',
    title: '桂枝去芍药加麻辛附子汤',
    kind: 'formula',
    comment: CH14 + '：气分，心下坚，大如盘，边如旋杯，水饮所作，桂枝去芍药加麻辛附子汤主之。',
    needs: [
      // 心口盘大硬结 + 阳虚寒凝（怕冷/四肢凉）
      ['epigastric_mass_plate.yes', 'cold_extremities.yes'],
      ['epigastric_mass_plate.yes', 'pitting_edema.yes']
    ],
    contraindications: [
      '治气分而偏**阳虚寒凝**者：心口下盘大硬结，伴四肢发凉',
      '桂枝汤去芍药 + 麻黄、细辛、附子——温阳散寒、通阳化气',
      '为什么去芍药：芍药酸收敛阴，会妨碍通阳散寒，所以去掉',
      '和枳术汤是一虚一实：本方偏阳虚寒凝（虚），枳术汤偏气滞水停（实）',
      '附子有毒须炮制久煎'
    ],
    ref: CH14 + ' · 气分，心下坚，大如盘，边如旋杯，水饮所作，桂枝去芍药加麻辛附子汤主之'
  },
  {
    name: 'zhizhu_tang',
    title: '枳术汤',
    kind: 'formula',
    comment: CH14 + '：心下坚，大如盘，边如旋盘，水饮所作，枳术汤主之。枳实七枚，白术二两。',
    needs: [
      // 心口盘大硬结 + 腹胀（气滞水停）
      ['epigastric_mass_plate.yes', 'abdominal_fullness.yes'],
      ['epigastric_mass_plate.yes']
    ],
    contraindications: [
      '治气分而偏**气滞水停**者：心口下盘大硬结',
      '只有两味：枳实（七枚，破气消痞）、白术（二两，健脾燥湿）',
      '枳实用量大于白术，重点在**行气**；比例妙在「气行则水行」',
      '原文服法是「以水五升，煮取三升，分温三服，腹中软即当散也」——吃到腹部变软就是有效',
      '后世「枳术丸」（白术倍枳实）就是从这首方化出的健脾消痞名方，但比例正好相反'
    ],
    ref: CH14 + ' · 心下坚，大如盘，边如旋盘，水饮所作，枳术汤主之（枳实七枚、白术二两）'
  }
]

// ---------- 校验 ----------
const { loadAll } = require(path.join(ROOT, 'core/loader'))
const { registry } = loadAll(PLUGINS)

function kwsOf(def) {
  if (!def || typeof def.trigger !== 'function') return []
  const m = /\[([\s\S]*?)\]/.exec(def.trigger.toString())
  return m ? [...m[1].matchAll(/'([^']*)'|"([^"]*)"/g)].map(x => x[1] || x[2]) : []
}

const ALL_SYMPTOMS = NEW_SYMPTOMS.concat(EXTRA_SYMPTOMS)
const errors = []
for (const s of ALL_SYMPTOMS) if (registry[s.name]) errors.push(s.name + ' 已存在')
for (const f of SUMMARIES.concat(FORMULAS)) if (registry[f.name]) errors.push(f.name + ' 已存在')
const willExist = new Set(
  ALL_SYMPTOMS.map(s => s.name)
    .concat(SUMMARIES.map(s => s.name))
    .concat(FORMULAS.map(f => f.name))
)
for (const f of SUMMARIES.concat(FORMULAS)) {
  for (const p1 of (f.needs || [])) for (const c of p1) {
    const dep = String(c).split('.')[0]
    if (!registry[dep] && !willExist.has(dep)) errors.push(f.name + ' 引用不存在的节点 ' + dep)
  }
}
if (errors.length) { console.log('校验失败：\n  ' + errors.join('\n  ')); process.exit(1) }

console.log('=== 触发词查重（完全相同才报）===')
let collided = 0
for (const s of ALL_SYMPTOMS) {
  for (const kw of s.trigger) {
    for (const name of Object.keys(registry)) {
      for (const other of kwsOf(registry[name])) {
        if (other === kw) { console.log('  ⚠ 「' + kw + '」(' + s.name + ') 与 ' + name); collided++ }
      }
    }
  }
}
console.log(collided ? '  共 ' + collided + ' 处' : '  没有完全相同的关键词 ✓')

function render(model) {
  const m = Object.assign({}, model, { needs: (model.needs || []).map(p => p.map(P.condToRef)) })
  return P.generatePluginSource(m).replace('  needs:', '  // ' + model.comment + '\n  needs:')
}

function appendPath(id, newPaths, note) {
  let f = null
  for (const d of ['formulas', 'syndromes']) {
    const p = path.join(PLUGINS, d, id + '.js')
    if (fs.existsSync(p)) { f = p; break }
  }
  if (!f) return '   ⚠ 找不到 ' + id
  let src = fs.readFileSync(f, 'utf8')
  const todo = newPaths.filter(p => {
    const sig = p.map(c => c.replace(/\.(yes|no)$/, '')).sort().join('+')
    for (const line of src.split('\n')) {
      if (!line.includes('[')) continue
      const names = [...line.matchAll(/'([a-z0-9_]+)\.(yes|no)'/g)].map(x => x[1]).sort().join('+')
      if (names === sig) return false
    }
    return true
  })
  if (!todo.length) return '   = ' + id + ' 已有所需路径'
  const lines = todo.map(p => '    ' + JSON.stringify(p).replace(/"/g, "'")).join(',\n')
  let out = src.replace(/(\n\s*\],\n\s*contraindications)/, ',\n' + note + '\n' + lines + '$1')
  if (out === src) out = src.replace(/(\n\s*\]\n\s*\})/, ',\n' + note + '\n' + lines + '$1')
  if (out === src) return '   ⚠ ' + id + ' 没找到插入点'
  fs.writeFileSync(f, out, 'utf8')
  return '   ＋ ' + id + ' 追加 ' + todo.length + ' 条路径'
}

if (WRITE) {
  for (const s of ALL_SYMPTOMS) {
    fs.writeFileSync(path.join(PLUGINS, 'symptoms', s.name + '.js'), render(s), 'utf8')
    console.log('  ＋ 症状 ' + s.name + '（' + s.title + '）')
  }
  for (const f of SUMMARIES) {
    fs.writeFileSync(path.join(PLUGINS, 'syndromes', f.name + '.js'), render(f), 'utf8')
    console.log('  ＋ 证候 ' + f.name + '（' + f.title + '）')
  }
  for (const f of FORMULAS) {
    fs.writeFileSync(path.join(PLUGINS, 'formulas', f.name + '.js'), render(f), 'utf8')
    console.log('  ＋ 方剂 ' + f.name + '（' + f.title + '）')
  }

  console.log('\n=== 既有方剂追加路径 ===')
  console.log(appendPath('fangji_huangqi_tang',
    [['pitting_edema.yes', 'wind_aversion.yes', 'sweat.yes']],
    '    // 金匮 14.27：风水，脉浮身重，汗出恶风者，防己黄芪汤主之'))
  console.log(appendPath('puhui_san',
    [['pitting_edema.yes', 'cold_extremities.yes']],
    '    // 金匮 14.32：厥而皮水者，蒲灰散主之'))

  const prov = JSON.parse(fs.readFileSync(PROV, 'utf8'))
  for (const s of ALL_SYMPTOMS) prov.nodes[s.name] = { source: 'jinkui', label: '金匮要略原文', refs: [s.comment], by: 'system:jinkui' }
  for (const f of SUMMARIES.concat(FORMULAS)) prov.nodes[f.name] = { source: 'jinkui', label: '金匮要略原文', refs: [f.ref], by: 'system:jinkui' }
  fs.writeFileSync(PROV, JSON.stringify(prov, null, 2) + '\n', 'utf8')
  console.log('\n已写入：' + ALL_SYMPTOMS.length + ' 症状 + ' + SUMMARIES.length + ' 证候 + ' + FORMULAS.length + ' 方剂')
} else {
  for (const s of ALL_SYMPTOMS) console.log('\n症状 ' + s.name + '（' + s.title + '）｜' + s.ask)
  for (const s of SUMMARIES) {
    console.log('\n证候 ' + s.name + '（' + s.title + '）')
    s.needs.forEach((p, i) => console.log('  路径' + (i + 1) + ': ' + p.join(' + ')))
  }
  console.log('\n方剂：')
  for (const f of FORMULAS) console.log('  ' + f.title.padEnd(30) + JSON.stringify(f.needs))
  console.log('\n（预览，加 --write 落库）')
}
