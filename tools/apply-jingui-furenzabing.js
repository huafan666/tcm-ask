'use strict'
// tools/apply-jingui-furenzabing.js
// 金匮批 23：第二十二篇 妇人杂病脉证并治（22.1 ~ 22.23）
//
// 口径同前几批：白话优先、要素按事实、AND 只放关键症状、病机进 contraindications、脉象一律不做。
// 22.3 / 22.4 是针刺期门的治法条、22.8 / 22.9 是妇人之病的病机总论 → 不落节点
const fs = require('fs')
const path = require('path')
const P = require('../dev/lib/parse')

const ROOT = path.join(__dirname, '..')
const PLUGINS = path.join(ROOT, 'plugins')
const PROV = path.join(PLUGINS, 'provenance.json')
const WRITE = process.argv.includes('--write')
const CH22 = '金匮要略·妇人杂病脉证并治第二十二'

// ---------- 新症状 ----------
const NEW_SYMPTOMS = [
  {
    name: 'throat_lump_foreign',
    title: '嗓子里像有块肉堵着',
    kind: 'symptom',
    comment: CH22 + '：妇人咽中如有炙脔，半夏厚朴汤主之（炙脔＝烤熟的肉块）。',
    trigger: ['嗓子里像有块肉堵着', '咽中如有炙脔', '喉咙里有东西堵着吞不下吐不出',
      '嗓子里有异物感', '喉咙像有块肉', '咽不下吐不出', '嗓子眼堵着个东西'],
    negate: ['嗓子没有异物感'],
    ask: '是不是嗓子里好像有块肉堵着，咳不出来也咽不下去？'
  },
  {
    name: 'sad_cry_easily',
    title: '老想哭、莫名悲伤',
    kind: 'symptom',
    comment: CH22 + '：妇人脏躁，喜悲伤欲哭，象如神灵所作，数欠伸，甘麦大枣汤主之。',
    trigger: ['老想哭', '莫名悲伤想哭', '喜悲伤欲哭', '无缘无故就想哭', '心里难过老掉眼泪',
      '情绪一低落就哭', '控制不住想哭'],
    negate: ['情绪平稳'],
    ask: '是不是经常莫名地悲伤、控制不住想哭？'
  },
  {
    name: 'frequent_yawning',
    title: '老伸懒腰打哈欠',
    kind: 'symptom',
    comment: CH22 + '：象如神灵所作，数欠伸（欠伸＝打哈欠、伸懒腰）。',
    trigger: ['老伸懒腰打哈欠', '数欠伸', '不停打哈欠', '总是伸懒腰', '哈欠连天',
      '老想伸懒腰'],
    negate: ['不打哈欠'],
    ask: '是不是总是打哈欠、伸懒腰，控制不住？'
  },
  {
    name: 'vaginal_discharge',
    title: '白带多/下白物',
    kind: 'symptom',
    comment: CH22 + '：妇人经水闭不利，脏坚癖不止，中有干血，下白物，矾石丸主之。',
    trigger: ['白带多', '下白物', '白带量多', '分泌物多', '白带绵绵不断', '阴道流出白色物'],
    negate: ['白带正常'],
    ask: '是不是白带（分泌物）特别多、绵绵不断？'
  },
  {
    name: 'yin_chui',
    title: '阴道排气有声',
    kind: 'symptom',
    comment: CH22 + '：胃气下泄，阴吹而正暄，此谷气之实也，膏发煎导之。',
    trigger: ['阴道排气有声', '阴吹', '下面有气出来还响', '阴道会排气', '下身像放屁一样响'],
    negate: ['没有这种情况'],
    ask: '是不是阴道会像放屁一样排气、还有声音？'
  }
]

// ---------- 证候 4 个 ----------
const SUMMARIES = [
  {
    name: 're_ru_xue_shi',
    title: '热入血室',
    kind: 'summary',
    comment: CH22 + '：妇人中风，七八日续来寒热，发作有时，经水适断，此为热入血室，其血必结，故使如疟状……小柴胡汤主之。',
    needs: [
      // 经期/产后 + 寒热往来 + 谵语（暮则谵语）
      ['alternating_cold_heat.yes', 'delirium.yes'],
      ['alternating_cold_heat.yes', 'vaginal_bleeding.yes'],
      ['delirium.yes', 'vaginal_bleeding.yes', 'fever.yes']
    ],
    contraindications: [
      '热入血室是**妇女在月经期（或产后）感受外邪**，热邪乘虚侵入血室（胞宫）',
      '三个典型特征：一是**经水适来/适断**（正好来月经或月经刚断）；' +
      '二是**寒热发作有时、像疟疾一样**；三是**谵语**（说胡话）',
      '特别注意 22.2 那句辨识要点：「**昼日明了，暮则谵语如见鬼状**」——' +
      '白天神志清楚、到傍晚就胡言乱语像见了鬼，这是热入血室的特征，不是阳明腑实',
      '治法：轻证用小柴胡汤和解；「治之无犯胃气及上二焦，必自愈」——不要误用攻下；' +
      '重证针刺期门（肝之募穴）随其实泻之',
      '⚠ 与阳明腑实谵语的区别：那种有腹满硬痛、大便不通、潮热，本条没有'
    ],
    ref: CH22 + ' · 经水适断，此为热入血室，其血必结，故使如疟状，发作有时，小柴胡汤主之'
  },
  {
    name: 'mei_he_qi',
    title: '梅核气',
    kind: 'summary',
    comment: CH22 + '：妇人咽中如有炙脔，半夏厚朴汤主之。',
    needs: [
      ['throat_lump_foreign.yes'],
      ['throat_lump_foreign.yes', 'chest_qi_stuffiness.yes'],
      ['throat_lump_foreign.yes', 'hypochondriac_fullness.yes']
    ],
    contraindications: [
      '梅核气：**咽中如有炙脔**——嗓子里好像有块烤熟的肉堵着，咳不出来也咽不下去，' +
      '但吃饭喝水不受影响（这一点很重要，可与真正的食管梗阻区分）',
      '病机是**痰气互结**：情志不舒、气机郁滞，痰随气结于咽喉',
      '半夏厚朴汤（半夏、厚朴、茯苓、生姜、苏叶）——行气开郁、降逆化痰',
      '多见于情绪紧张、压力大时加重；现代常对应咽部异物感症、癔球症',
      '⚠ 如果**真的吞咽困难、体重下降、进食梗阻感进行性加重**，必须做胃镜排除食管病变，' +
      '不能一律当梅核气'
    ],
    ref: CH22 + ' · 妇人咽中如有炙脔，半夏厚朴汤主之'
  },
  {
    name: 'zang_zao',
    title: '脏躁',
    kind: 'summary',
    comment: CH22 + '：妇人脏躁，喜悲伤欲哭，象如神灵所作，数欠伸，甘麦大枣汤主之。',
    needs: [
      ['sad_cry_easily.yes'],
      ['sad_cry_easily.yes', 'frequent_yawning.yes'],
      ['sad_cry_easily.yes', 'restless.yes'],
      ['sad_cry_easily.yes', 'vex_insomnia.yes']
    ],
    contraindications: [
      '脏躁：**喜悲伤欲哭、象如神灵所作、数欠伸**——老想哭、情绪不能自主（像有神灵作祟）、' +
      '还不停打哈欠伸懒腰',
      '病机是脏阴不足、心神失养（「脏」指五脏之阴，「躁」是躁动不安）',
      '甘麦大枣汤只有三味：甘草、小麦、大枣——**甘润缓急、养心安神**，是极平和的方子',
      '原文虽写在妇人篇，但男女都可出现；多见于更年期、情绪波动大、产后或久病体虚者',
      '⚠ 长期情绪低落、兴趣丧失、有自伤念头的，要考虑抑郁症，须精神心理科评估，不能只服中药'
    ],
    ref: CH22 + ' · 妇人脏躁，喜悲伤欲哭，象如神灵所作，数欠伸'
  },
  {
    name: 'zhuan_bao',
    title: '转胞',
    kind: 'summary',
    comment: CH22 + '：妇人病饮食如故，烦热不得卧，而反倚息者……此名转胞，不得溺也。以胞系了戾，故致此病。但利小便则愈，宜肾气丸主之。',
    needs: [
      // 小便不出 + 饮食正常 + 躺不平（倚息）
      ['urination_difficulty.yes', 'low_appetite.no'],
      ['urination_difficulty.yes', 'orthopnea.yes'],
      ['urination_difficulty.yes', 'restless.yes']
    ],
    contraindications: [
      '转胞：**想尿却尿不出来**（不得溺），伴心烦发热、躺不平、只能靠着呼吸',
      '原文强调「**饮食如故**」——能吃能喝，说明病不在中焦，而在下焦膀胱',
      '病机是「胞系了戾」——膀胱系带扭转、气化不行（古人形象的说法）',
      '治法「但利小便则愈」，用肾气丸温阳化气——不是利尿药，而是**恢复膀胱的气化功能**',
      '⚠ 突然尿不出来（急性尿潴留）属急症，须立即导尿，尤其产后、术后常见'
    ],
    ref: CH22 + ' · 此名转胞，不得溺也。以胞系了戾，故致此病。但利小便则愈，宜肾气丸主之'
  }
]

// ---------- 方剂 10 个新建 ----------
const FORMULAS = [
  {
    name: 'banxia_houpo_tang',
    title: '半夏厚朴汤',
    kind: 'formula',
    comment: CH22 + '：妇人咽中如有炙脔，半夏厚朴汤主之。',
    needs: [['mei_he_qi.yes']],
    contraindications: [
      '治梅核气：咽中如有炙脔，咳不出咽不下，但吃饭不受影响',
      '五味：半夏、厚朴、茯苓、生姜、紫苏叶——**行气开郁、降逆化痰**',
      '「气行则痰消」：本方的重点在行气，气顺了痰自然化解',
      '服法「分四服，日三夜一服」，慢慢喝',
      '⚠ 一定要先排除真正的食管病变（吞咽困难、进行性加重、消瘦）'
    ],
    ref: CH22 + ' · 半夏厚朴汤方（半夏一升、厚朴三两、茯苓四两、生姜五两、苏叶二两）'
  },
  {
    name: 'ganmai_dazao_tang',
    title: '甘麦大枣汤',
    kind: 'formula',
    comment: CH22 + '：妇人脏躁，喜悲伤欲哭，象如神灵所作，数欠伸，甘麦大枣汤主之。',
    needs: [['zang_zao.yes']],
    contraindications: [
      '治脏躁：无故悲伤欲哭、情绪不能自主、频打哈欠',
      '只有三味，而且**都是食材**：甘草三两、小麦一升、大枣十枚——甘润缓急、养心安神',
      '原文说「亦补脾气」——通过补养脾胃来安神',
      '这是极平和的方子，也是中医「甘麦大枣汤」成为安神名方的原因',
      '⚠ 重度抑郁、有自伤风险必须专科就诊，中药只是辅助'
    ],
    ref: CH22 + ' · 甘麦大枣汤方（甘草三两、小麦一升、大枣十枚）'
  },
  {
    name: 'wenjing_tang',
    title: '温经汤',
    kind: 'formula',
    comment: CH22 + '：妇人年五十所，病下利数十日不止，暮即发热，少腹里急，腹满，手掌烦热，唇口干燥……曾经半产，瘀血在少腹不去。',
    needs: [
      // 更年期 + 手掌烦热 + 唇口干燥 + 少腹拘急
      ['hand_foot_hot.yes', 'throat_dry.yes', 'lower_abdomen_cramp.yes'],
      ['hand_foot_hot.yes', 'abdominal_fullness.yes', 'vaginal_bleeding.yes'],
      ['lower_abdomen_cramp.yes', 'vaginal_bleeding.yes', 'weight_loss.yes']
    ],
    contraindications: [
      '治「妇人年五十所」——**更年期前后的复杂症候**：傍晚发热、小腹拘急、腹满、手掌烦热、唇口干燥',
      '原文点明病根：「曾经半产，**瘀血在少腹不去**」——小产或流产留下瘀血，日久化热伤阴',
      '十二味：吴茱萸、桂枝、生姜温经；当归、川芎、芍药、阿胶、麦冬、丹皮养血滋阴清热；' +
      '人参、甘草补气——**温经散寒与养血滋阴并用**',
      '这是妇科调经的千古名方，凡「寒热错杂、虚实夹杂」的月经病、更年期综合征都可考虑',
      '⚠ 原文「病下利数十日不止」的「下利」，多数注家认为指**下血（阴道出血）**而非腹泻，联系上下文更通'
    ],
    ref: CH22 + ' · 温经汤方（吴茱萸三两、当归、芎穷、芍药、人参、桂枝、阿胶、牡丹皮、生姜、甘草各二两、半夏半升、麦门冬一升）'
  },
  {
    name: 'tuguagen_san',
    title: '土瓜根散',
    kind: 'formula',
    comment: CH22 + '：带下经水不利，少腹满痛，经一月再见者，土瓜根散主之。',
    needs: [
      // 月经不畅 + 少腹满痛 + 一个月来两次
      ['abdominal_fullness.yes', 'lower_abdomen_cramp.yes', 'vaginal_bleeding.yes'],
      ['vaginal_bleeding.yes', 'fixed_mass.yes'],
      ['lower_abdomen_cramp.yes', 'abdominal_pain.yes', 'vaginal_discharge.yes']
    ],
    contraindications: [
      '治瘀血导致的月经不调：**经水不利、少腹满痛、一个月来两次月经**',
      '四味：土瓜根、芍药、桂枝、䗪虫——活血化瘀通经',
      '「经一月再见者」是瘀血阻滞、血不循经的表现，瘀去则经自调',
      '⚠ 月经频发、异常出血要排除子宫内膜病变、子宫肌瘤、内分泌问题'
    ],
    ref: CH22 + ' · 土瓜根散方（土瓜根、芍药、桂枝、䗪虫各三分）'
  },
  {
    name: 'jiaojiang_tang',
    title: '胶姜汤',
    kind: 'formula',
    comment: CH22 + '：妇人陷经，漏下黑不解，胶姜汤主之。',
    needs: [
      // 漏下 + 血色黑（寒凝血瘀）+ 虚
      ['vaginal_bleeding.yes', 'poor_complexion.yes'],
      ['vaginal_bleeding.yes', 'cold_extremities.yes'],
      ['lou_xia.yes', 'blood_clot_dark.yes']
    ],
    contraindications: [
      '治「陷经」：**漏下不止、血色发黑而久不愈**（陷＝下陷不升）',
      '**原方组成未见于《金匮》正文**，只留方名。后世多认为是阿胶+干姜（故称胶姜汤），也有认为是胶艾汤类',
      '「漏下黑不解」的病机是冲任虚寒、瘀血内停——血色黑说明有寒有瘀，' +
      '所以要用阿胶养血、干姜温经',
      '⚠ 方药组成不确定，实际用药须由医师据证拟定'
    ],
    ref: CH22 + ' · 妇人陷经，漏下黑不解，胶姜汤主之（方未见）'
  },
  {
    name: 'dahuang_gansui_tang',
    title: '大黄甘遂汤',
    kind: 'formula',
    comment: CH22 + '：妇人少腹满如敦状，小便微难而不渴，生后者，此为水与血俱结血室也，大黄甘遂汤主之。',
    needs: [
      // 少腹满如敦状 + 小便微难 + 不渴（水血互结）
      ['abdominal_fullness.yes', 'urination_difficulty.yes', 'thirsty.no'],
      ['lower_abdomen_swelling_pain.yes', 'urination_difficulty.yes'],
      ['abdominal_fullness.yes', 'fixed_mass.yes', 'thirsty.no']
    ],
    contraindications: [
      '治「水与血俱结在血室」：**少腹满得像倒扣的敦（古代器皿）形状、小便略微困难、口不渴**',
      '「生后者」指产后（或产后不久）出现这种情况',
      '三味：大黄、甘遂、阿胶——**大黄、甘遂依法水，阿胶护阴血**',
      '关键在「水血互结」：单纯利水不行、单纯化瘀也不行，必须两者同攻，同时用阿胶防伤正',
      '⚠ **甘遂有毒、峻下逐水**，用量须极严格；孕妇绝对禁用；体虚者忌用'
    ],
    ref: CH22 + ' · 妇人少腹满如敦状，小便微难而不渴，生后者，此为水与血俱结血室也，大黄甘遂汤主之（大黄四两、甘遂二两、阿胶二两）'
  },
  {
    name: 'fanshi_wan',
    title: '矾石丸',
    kind: 'formula',
    comment: CH22 + '：妇人经水闭不利，脏坚癖不止，中有干血，下白物，矾石丸主之。',
    needs: [
      // 经闭 + 坚癖包块 + 白带多
      ['amenorrhea.yes', 'fixed_mass.yes', 'vaginal_discharge.yes'],
      ['vaginal_discharge.yes', 'fixed_mass.yes']
    ],
    contraindications: [
      '治经闭不行、腹中有坚癖块、干血内结而出现**白带增多**（下白物）',
      '**这是外用的坐药（阴道栓剂）**：矾石（白矾）烧过研末，用杏仁泥和成枣核大，纳阴中',
      '矾石收敛燥湿止带，外用治带下；干血内结则需另配内服药',
      '⚠ 明确是**外用**，不可内服',
      '⚠ 现代阴道分泌物异常要先查**阴道炎、宫颈病变**，做白带常规和宫颈筛查'
    ],
    ref: CH22 + ' · 矾石丸方（矾石三分烧、杏仁一分，炼蜜和丸枣核大，内脏中）'
  },
  {
    name: 'honglanhua_jiu',
    title: '红蓝花酒',
    kind: 'formula',
    comment: CH22 + '：妇人六十二种风，及腹中血气刺痛，红蓝花酒主之。',
    needs: [
      // 腹中刺痛（血瘀痛，痛如针刺）
      ['abdominal_pain.yes', 'fixed_mass.yes'],
      ['abdominal_pain.yes', 'migratory_pain.no'],
      ['lower_abdomen_cramp.yes', 'abdominal_pain.yes']
    ],
    contraindications: [
      '治「腹中血气刺痛」——**痛如针刺、位置固定**的血瘀性腹痛',
      '只有一味：红蓝花（即红花），用酒一大升煎，「顿服一半，未止再服」',
      '红花活血通经，酒助其行散——是活血止痛的极简方',
      '「妇人六十二种风」是古人对妇科杂症的泛称',
      '⚠ 孕妇禁用（红花活血，有堕胎之弊）；有出血倾向者忌用'
    ],
    ref: CH22 + ' · 红蓝花酒方（红蓝花一两，以酒一大升煎减半，顿服一半）'
  },
  {
    name: 'shechuangzi_san',
    title: '蛇床子散',
    kind: 'formula',
    comment: CH22 + '：蛇床子散方，温阴中坐药。',
    needs: [
      // 阴中冷 + 带下（外用坐药）
      ['vulvar_cold.yes'],
      ['vaginal_discharge.yes', 'vulvar_cold.yes'],
      ['vaginal_discharge.yes', 'genital_ulcer.yes']
    ],
    contraindications: [
      '**外用的坐药（阴道栓）**，原文明确说「温阴中坐药」——温煦阴中',
      '只有一味蛇床子，研末用白粉（米粉）少许和成枣核大，绵裹纳阴中',
      '蛇床子温肾助阳、燥湿杀虫，是治阴部寒冷、带下、阴痒的经典外用药',
      '⚠ **只可外用，不可内服**（内服须严格炮制用量）',
      '⚠ 阴部瘙痒、分泌物异常要先查阴道炎（滴虫、霉菌等）'
    ],
    ref: CH22 + ' · 蛇床子散方（蛇床子仁为末，以白粉少许和令相得如枣大，绵裹内之）'
  },
  {
    name: 'langya_tang',
    title: '狼牙汤',
    kind: 'formula',
    comment: CH22 + '：少阴脉滑而数者，阴中即生疮，阴中蚀疮烂者，狼牙汤洗之。',
    needs: [
      // 阴中生疮溃烂
      ['genital_ulcer.yes'],
      ['genital_ulcer.yes', 'vaginal_discharge.yes']
    ],
    contraindications: [
      '治**阴中生疮、溃烂**（外阴阴道溃疡），用狼牙汤**外洗**',
      '狼牙（即狼牙草，一说为仙鹤草根芽）三味煎汤，「以绵缠箸头，沥汤洗之，日四遍」',
      '⚠ **外洗方，不可内服**；狼牙有毒，用量须严格控制',
      '⚠ 外阴溃疡要查明原因：单纯疱疹、梅毒、白塞病、外阴癌等都可能表现为溃疡，必须专科检查'
    ],
    ref: CH22 + ' · 少阴脉滑而数者，阴中即生疮，阴中蚀疮烂者，狼牙汤洗之（狼牙三两）'
  }
]

// 额外症状（供上方使用）
const EXTRA_SYMPTOMS = [
  {
    name: 'amenorrhea',
    title: '月经不来',
    kind: 'symptom',
    comment: CH22 + '：妇人经水闭不利……妇人经水不利下。',
    trigger: ['月经不来', '经水闭', '闭经', '好几个月没来月经', '月经停了不来',
      '月经闭止'],
    negate: ['月经正常来'],
    ask: '是不是月经不来（闭经）？'
  },
  {
    name: 'vulvar_cold',
    title: '阴部发冷',
    kind: 'symptom',
    comment: CH22 + '：蛇床子散方，温阴中坐药（阴中寒冷）。',
    trigger: ['阴部发冷', '阴中冷', '下面发凉', '阴道里发冷', '阴部冰凉'],
    negate: ['阴部不冷'],
    ask: '是不是阴部（阴道里）发凉、发冷？'
  },
  {
    name: 'blood_clot_dark',
    title: '出血颜色发黑暗淡',
    kind: 'symptom',
    comment: CH22 + '：妇人陷经，漏下黑不解（血色黑而久不止）。',
    trigger: ['出血颜色发黑', '血色发暗', '血是黑褐色的', '流血颜色发黑发暗',
      '经血黑褐色', '血色暗淡有块'],
    negate: ['血色鲜红'],
    ask: '是不是出血的颜色发黑、发暗（偏黑褐色）？'
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
  const flat = /needs:\s*\[((?:\s*'[^']*'\s*,?)+)\]\s*,/.exec(src)
  if (flat && !flat[1].includes('[')) {
    const items = [...flat[1].matchAll(/'([^']*)'/g)].map(x => "'" + x[1] + "'")
    src = src.replace(flat[0], 'needs: [\n    [' + items.join(', ') + ']\n  ],')
  }
  const todo = newPaths.filter(p => {
    const sig = p.map(c => c.replace(/\.(yes|no)$/, '')).sort().join('+')
    for (const line of src.split('\n')) {
      if (!line.includes('[')) continue
      const names = [...line.matchAll(/'([a-z0-9_]+)\.(yes|no)'/g)].map(x => x[1]).sort().join('+')
      if (names === sig) return false
    }
    return true
  })
  if (!todo.length) { fs.writeFileSync(f, src, 'utf8'); return '   = ' + id + ' 已有所需路径' }
  const lines = todo.map(p => '    ' + JSON.stringify(p).replace(/"/g, "'")).join(',\n')
  let out = src.replace(/(\n\s*\],\s*contraindications)/, ',\n' + note + '\n' + lines + '$1')
  if (out === src) out = src.replace(/(\n\s*\],\n\s*contraindications)/, ',\n' + note + '\n' + lines + '$1')
  if (out === src) out = src.replace(/(\n\s*\]\n\s*\})/, ',\n' + note + '\n' + lines + '$1')
  if (out === src) { fs.writeFileSync(f, src, 'utf8'); return '   ⚠ ' + id + ' 没找到插入点' }
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
  console.log(appendPath('xiaochaihu_tang',
    [['alternating_cold_heat.yes', 'vaginal_bleeding.yes']],
    '    // 金匮 22.1：妇人中风……经水适断，此为热入血室……小柴胡汤主之'))
  console.log(appendPath('xiaoqinglong_tang',
    [['saliva_spit.yes', 'epigastric_lump_soft.yes']],
    '    // 金匮 22.7：妇人吐涎沫，医反下之，心下即痞，当先治其吐涎沫，小青龙汤主之'))
  console.log(appendPath('xuanfuhua_tang',
    [['vaginal_bleeding.yes', 'blood_clot_dark.yes']],
    '    // 金匮 22.12：妇人则半产漏下，旋覆花汤主之'))
  console.log(appendPath('danggui_shaoyao_san',
    [['abdominal_pain.yes', 'vaginal_discharge.yes']],
    '    // 金匮 22.18：妇人腹中诸疾痛，当归芍药散主之'))
  console.log(appendPath('xiaojianzhong_tang',
    [['abdominal_pain.yes', 'low_energy.yes', 'postpartum.no']],
    '    // 金匮 22.19：妇人腹中痛，小建中汤主之'))
  console.log(appendPath('bawei_shenqi_wan',
    [['urination_difficulty.yes', 'low_appetite.no', 'orthopnea.yes']],
    '    // 金匮 22.20：此名转胞，不得溺也……但利小便则愈，宜肾气丸主之'))
  console.log(appendPath('zhugao_fajian',
    [['yin_chui.yes']],
    '    // 金匮 22.23：胃气下泄，阴吹而正暄，此谷气之实也，膏发煎导之'))

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
  for (const f of FORMULAS) console.log('  ' + f.title.padEnd(20) + JSON.stringify(f.needs))
  console.log('\n（预览，加 --write 落库）')
}
