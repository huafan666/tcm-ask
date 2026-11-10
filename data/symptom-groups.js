'use strict'
// data/symptom-groups.js
// 症状筛选组（上位节点）定义 —— 全量族表
//
// 设计规矩（用户 2026-02 定）：
//   1. 上位节点只做**粗筛**，不参与证候/方剂的 needs 推理，与后面的架构完全分开
//   2. 判定规则：任一子症状 = yes ⇒ 组 = yes；子症状 = no **不影响**组；组永不被判 no
//      （只否定了一个子类，不等于否定整个大类）
//   3. 组自己的 trigger 只放**大类词**，可以宽（因为规则 2 兜底，不会被"N不X"带成 no），
//      但**绝不放内容物词**（吐血/吐涎沫/吐蛔要在具体症状里答）
//   4. 有歧义的一律不归族，各自单列，让病人答准确：
//      · 咯血（咳出来的血）不算吐血
//      · 恶心（想吐没吐）不算呕吐
//      · 吞咽困难不算呕吐
//      · 咳痰不算呕吐
//      · 便血不算下利
//      · 腰酸（酸）不算疼痛（痛）
//   5. 允许一个症状属于多个组（多维度）：如 便脓血 同时属于「下利」和「出血」
//
// trigger 里刻意**不含**的单字/易混淆词，见每个组的 `notIncluded` 说明。

const GROUPS = [
  // ============ 动作维度：身体做了什么 ============
  {
    name: 'vomit_any',
    title: '呕吐（胃里的东西经口吐出来）',
    dimension: '动作',
    ask: '是不是会吐——把胃里的东西从嘴里吐出来？（不管吐的是水、食物、血还是别的）',
    // trigger 只放**确定表示呕吐动作**的大类词。
    // 刻意不含：「想吐」（那是恶心，见 nausea）、「吐出来」（「把痰吐出来」会误判）、
    //          以及任何内容物词（吐血/吐涎沫/吐蛔）——内容物必须在具体症状里答。
    trigger: ['呕', '呕吐', '干呕', '反胃', '吐了', '吐得'],
    children: [
      'vomiting', 'vomit_saliva', 'vomit_on_food', 'vomit_on_intake',
      'vomit_right_after_eating', 'food_vomit_delayed', 'water_reflux',
      'hematemesis', 'tu_nongxue', 'round_worm_vomit', 'saliva_spit',
      'pregnancy_vomit', 'vex_like_vomit', 'saliva_heart_pain_paroxysmal'
    ],
    notIncluded: '咯血（咳出来的血）、恶心（想吐但没吐）、吞咽困难、咳痰、咽喉异物感 —— 这些都不是「吐」'
  },
  {
    name: 'diarrhea_any',
    title: '下利（大便稀薄、次数多）',
    dimension: '动作',
    ask: '是不是拉肚子——大便稀、不成形或者次数多？',
    trigger: ['下利', '拉肚', '泄泻', '腹泻', '便溏', '溏泄', '拉稀', '一天拉'],
    children: ['diarrhea', 'chronic_diarrhea', 'clear_grain_diarrhea', 'duck_stool', 'qi_li'],
    notIncluded: '便血/黑便（那是出血不是下利）、便秘（相反）、下坠感'
  },
  {
    name: 'cough_any',
    title: '咳嗽',
    dimension: '动作',
    ask: '是不是会咳嗽？',
    trigger: ['咳', '咳嗽', '干咳', '呛咳'],
    children: ['cough', 'qi_upward_cough', 'cough_pleuritic_pain', 'foul_pus_sputum', 'hemoptysis', 'throat_rales'],
    notIncluded: '喘（呼吸急迫不是咳）、短气、喉咙痰鸣音'
  },
  {
    name: 'dyspnea_any',
    title: '喘（呼吸急迫、接不上气）',
    dimension: '动作',
    ask: '是不是呼吸急迫、喘不上气，或者气不够用？',
    trigger: ['喘', '气短', '短气', '上气', '呼吸困难', '接不上气', '气不够'],
    children: ['chuan', 'short_breath', 'orthopnea'],
    notIncluded: '咳（咳嗽本身不算喘）、叹气、气上冲（那是气逆感）'
  },
  {
    name: 'belch_any',
    title: '嗳气打嗝（胃里的气从嘴里出来）',
    dimension: '动作',
    ask: '是不是会打嗝、嗳气——胃里的气从嘴里返出来？',
    trigger: ['嗳气', '打嗝', '噫气', '呃逆', '哕'],
    children: ['belching', 'belch_food_smell', 'hiccup'],
    notIncluded: '呕吐（带出东西）、叹气'
  },
  {
    name: 'sweat_any',
    title: '出汗',
    dimension: '动作',
    ask: '是不是身上会出汗？',
    trigger: ['汗', '出汗', '冒汗', '透汗'],
    children: ['sweat', 'auto_sweat', 'night_sweat', 'cold_sweat', 'head_sweat_only',
      'leak_sweat', 'yellow_sweat', 'waist_split_sweat', 'shouhan'],
    notIncluded: '无汗（相反）；水肿、阴部潮湿不算出汗'
  },

  // ============ 物质维度：出来的是什么 ============
  {
    name: 'bleeding_any',
    title: '出血（血从身体里流出来）',
    dimension: '物质',
    ask: '是不是有出血——不管是从嘴里、鼻子、大便、小便还是阴道？',
    trigger: ['出血', '流血', '见血', '带血', '下血', '血不'],
    children: ['hematemesis', 'epistaxis', 'stool_blood', 'hematuria', 'blood_pus_stool',
      'vaginal_bleeding', 'blood_after_stool', 'blood_before_stool', 'tu_nongxue',
      'lochia_retention', 'blood_clot_dark',
      // 咯血（咳出来的血）属出血，但**绝不进呕吐族**——吐血是呕出来的，咯血是咳出来的
      'hemoptysis'],
    notIncluded: '月经不来/月经减少（那是没有血，不是出血）；血虚、贫血'
  },
  {
    name: 'edema_any',
    title: '水肿（身上肿起来）',
    dimension: '物质',
    ask: '是不是身上有肿——脸、眼睛、手脚或者下身肿起来？',
    trigger: ['肿', '浮肿', '水肿', '肿起', '发肿'],
    children: ['pitting_edema', 'mild_edema', 'eyelid_puffy', 'foot_swelling_drop', 'scrotal_edema', 'wocanminxian'],
    notIncluded: '肿块/包块（那是长东西不是水肿）、关节肿大（是关节不是水肿）'
  },

  // ============ 部位维度：哪里不舒服 ============
  {
    name: 'pain_any',
    title: '疼痛',
    dimension: '部位',
    ask: '是不是身上有疼痛——不管哪个部位？',
    trigger: ['痛', '疼', '酸痛', '刺痛', '绞痛', '剧痛', '隐痛', '胀痛'],
    children: [
      'abdominal_pain', 'abdominal_cramp_after_birth', 'chest_back_pain',
      'circumumbilical_pain', 'duzijiaotonghuocitong', 'epigastric_pressing_pain',
      'fengchi_tong', 'full_epigastric_hard_pain', 'heart_bind_pain',
      'heart_hanging_pain', 'heart_pain_radiate', 'hypochondriac_side_pain',
      'jiao_qi_pain', 'joint_pain_rigid', 'joint_pain_severe', 'left_abdomen_press_pain',
      'lower_abdomen_swelling_pain', 'lower_abdominal_lump', 'neck_stiff_pain',
      'press_only_pain', 'press_pain_aggravated', 'severe_abdominal_pain',
      'throat_pain', 'tongjing', 'wei_tong', 'yaguan_tong', 'body_pain',
      'body_ache_stiff', 'cough_pleuritic_pain', 'zuolei_tong', 'zugengtong',
      'danjieshidianyatong', 'migratory_pain'
    ],
    notIncluded: '腰酸/肋酸（酸不是痛）、肚子拘急发紧（紧不是痛）、麻木、酸困'
  },
  {
    name: 'stool_any',
    title: '大便异常',
    dimension: '部位',
    ask: '是不是大便有问题——不管拉稀、干硬、带血还是发黑？',
    trigger: ['大便', '排便', '拉屎', '便干', '便硬'],
    children: ['diarrhea', 'chronic_diarrhea', 'clear_grain_diarrhea', 'duck_stool', 'qi_li',
      'constipation', 'qingdubianmi', 'stool_blood', 'black_stool',
      'blood_after_stool', 'blood_before_stool', 'blood_pus_stool', 'tenesmus'],
    notIncluded: '放屁（是气不是大便）、肠鸣'
  },
  {
    name: 'urination_any',
    title: '小便异常',
    dimension: '部位',
    ask: '是不是小便有问题——不管难尿、尿频、尿黄还是尿里有血？',
    trigger: ['小便', '尿', '排尿', '解手'],
    children: ['urination_difficulty', 'easy_urination', 'frequent_urination', 'dark_urine',
      'urine_incontinence', 'urine_gravel', 'polyuria', 'hematuria',
      'xiaobian_dilou', 'xiaobian_fuli'],
    notIncluded: '遗精/梦交（是精不是尿）、白带、水肿'
  },
  {
    name: 'hypochondrium_any',
    title: '胸胁（胸口和两侧肋骨下）不舒服',
    dimension: '部位',
    ask: '是不是胸口或两侧肋骨下面（胸胁）不舒服——胀、满、痛、堵？',
    trigger: ['胁', '胸胁', '肋骨', '胸满', '胸闷', '胸口'],
    children: ['hypochondriac_fullness', 'hypochondriac_mass', 'hypochondriac_rush',
      'hypochondriac_side_pain', 'zuolei_tong', 'left_leigu_suan',
      'chest_fullness', 'chest_qi_stuffiness', 'chest_stuffy', 'chest_lump_hard',
      'chest_indescribable', 'desire_to_press_chest',
      // 胸部疼痛类：原先只挂在 pain_any（全部位疼痛），会被算进「头身」系统，
      // 补进来才能归到「胸腹」
      'chest_back_pain', 'heart_bind_pain', 'heart_hanging_pain', 'heart_pain_radiate', 'danjieshidianyatong'],
    notIncluded: '心口（心下）的痞满另算；乳房肿块、肺的问题'
  },
  {
    name: 'abdomen_any',
    title: '腹部（肚子）不舒服',
    dimension: '部位',
    ask: '是不是肚子（腹部、小肚子）不舒服——胀、痛、紧、有块？',
    trigger: ['腹', '肚子', '小肚', '心口', '胃这块', '脐'],
    children: ['abdominal_fullness', 'abdominal_pain', 'abdominal_tension',
      'abdominal_cramp_after_birth', 'circumumbilical_pain', 'duzijiaotonghuocitong',
      'severe_abdominal_pain', 'fubulentong',
      'lower_abdomen_cramp', 'lower_abdomen_swelling_pain', 'lower_abdominal_lump',
      'epigastric_fullness', 'epigastric_lump_soft', 'epigastric_mass_plate',
      'epigastric_pressing_pain', 'press_only_pain', 'press_pain_aggravated',
      'full_epigastric_hard_pain', 'abdomen_bulging_mass', 'left_abdomen_press_pain',
      'borborygmus', 'flatus', 'chongji', 'wei_tong'],
    notIncluded: '胸胁（位置更高）、腰、固定包块（位置不定，不归腹部）'
  },

  // ============ 感觉维度：病人自己觉得 ============
  {
    name: 'fever_any',
    title: '发热（身上热、体温高）',
    dimension: '感觉',
    ask: '是不是有发热——身上发烫、摸着手心热，或者量体温偏高？',
    trigger: ['发热', '发烧', '身热', '灼热', '潮热', '壮热', '低烧', '高烧'],
    children: ['fever', 'tidal_fever', 'alternating_cold_heat', 'zijue_shenre', 'burning',
      'heat_only_no_chill', 'periodic_chill_fever', 'hand_foot_hot', 'shuangzu_re',
      'heart_hot'],
    notIncluded: '真热假寒/真寒假热/里寒外热（那是证候判断不是发热症状）、烦躁、口渴'
  },
  {
    name: 'cold_any',
    title: '寒冷感（怕冷、发冷、身上凉）',
    dimension: '感觉',
    ask: '是不是觉得冷——怕冷、发冷，或者某个部位发凉？',
    trigger: ['怕冷', '发冷', '恶寒', '畏寒', '冷', '凉'],
    children: ['cold_aversion', 'wind_aversion', 'mild_cold', 'back_cold_patch',
      'genital_cold', 'lower_back_cold', 'lower_leg_cold', 'xigaiyixialeng',
      'lower_abdomen_cold_fan', 'heart_cold_weak', 'chill_predominant',
      'cold_extremities'],
    notIncluded: '恶风（怕风与怕冷不同，但都记在这里便于粗筛）；喜冷饮（那是饮食偏好）'
  },
  {
    name: 'thirst_any',
    title: '口渴（想喝水）',
    dimension: '感觉',
    ask: '是不是口渴、想喝水？',
    trigger: ['渴', '想喝水', '要喝水'],
    children: ['thirsty', 'severe_thirst'],
    notIncluded: '口干只想漱口不想咽（瘀血的特异表现，不算口渴）；嗓子发干、鼻子发干（是燥不是渴）'
  },
  {
    name: 'appetite_any',
    title: '食欲异常',
    dimension: '感觉',
    ask: '是不是吃东西方面有问题——吃不下、特别能吃、或者食欲忽好忽坏？',
    trigger: ['吃不下', '不想吃', '食欲', '胃口', '能吃', '想吃饭'],
    children: ['low_appetite', 'hungry', 'polyphagia', 'appetite_fluctuating'],
    notIncluded: '恶心呕吐（是吐不是食欲）、消瘦、吞咽困难'
  },
  {
    name: 'dizziness_any',
    title: '头晕',
    dimension: '感觉',
    ask: '是不是头晕、眼前发黑或者天旋地转？',
    trigger: ['头晕', '眩晕', '头眩', '冒眩', '晕'],
    children: ['dizziness', 'unsteady_stance'],
    notIncluded: '头痛（是痛不是晕）、耳鸣'
  },
  {
    name: 'palpitation_any',
    title: '心慌心悸',
    dimension: '感觉',
    ask: '是不是心慌、心跳不安，或者心口窝/肚脐下跳动？',
    trigger: ['心慌', '心悸', '心跳', '悸动', '心窝跳'],
    children: ['heart_palp', 'below_palp', 'ben_tun'],
    notIncluded: '心痛（是痛不是悸）、气上冲（是气逆感）'
  },

  // ============ 状态维度 ============
  {
    name: 'sleep_any',
    title: '睡眠异常',
    dimension: '状态',
    ask: '是不是睡觉有问题——睡不着、老想睡、多梦或者睡不好？',
    // 病人说「睡眠不好」只是笼统描述（vague），必须细化到下面几种具体类型。
    // trigger 去掉了单字「睡」「眠」（太宽），改成语义明确的说法。
    trigger: ['睡眠', '睡不好', '睡不着', '失眠', '不寐', '多梦', '嗜睡',
      '老想睡', '入睡', '睡不实', '容易醒'],
    children: ['shuimianbuhao', 'insomnia_onset', 'frequent_waking', 'light_sleep',
      'vex_insomnia', 'sleepy', 'duomeng', 'restless_lying', 'dahan'],
    notIncluded: '烦躁（那是情绪）、昏睡不醒（神志问题）'
  },
  {
    name: 'mental_any',
    title: '神志情绪异常',
    dimension: '状态',
    ask: '是不是神志或情绪不对——说胡话、烦躁发狂、自言自语、或者莫名悲伤？',
    trigger: ['烦', '躁', '谵语', '发狂', '胡话', '悲伤', '哭泣'],
    children: ['delirium', 'manic', 'self_talk_ceaseless', 'aimless_walking', 'mute_quiet',
      'day_agitated_night_calm', 'restless', 'sad_cry_easily', 'frequent_yawning'],
    notIncluded: '失眠（睡眠类）、头晕、心悸'
  },
  {
    name: 'spasm_any',
    title: '抽筋痉挛（肌肉不自主动）',
    dimension: '状态',
    ask: '是不是有抽动、抽搐或者肌肉自己跳？',
    trigger: ['抽搐', '抽筋', '痉挛', '抽风', '肉跳', '动摇'],
    children: ['muscle_twitching', 'limb_spasm', 'limb_straight_spasm', 'epileptic_seizure',
      'du_tou_dong_yao'],
    notIncluded: '肢体麻木（是感觉异常）、站立不稳、半身不遂'
  },

  // ============ 部位维度（续）============
  {
    name: 'complexion_any',
    title: '面色/肤色异常',
    dimension: '部位',
    ask: '是不是脸色、皮肤颜色不对——发青、发黄、发黑、发白、发红或者忽变？',
    trigger: ['面色', '脸色', '气色', '肤色'],
    children: ['face_black', 'face_blue', 'face_pale', 'face_yellow', 'face_red_patches',
      'face_color_fluctuating', 'mian_chi', 'poor_complexion', 'forehead_dark', 'jaundice'],
    notIncluded: '局部发黑（眼眶、额头已单列但也可归此）；斑疹、疮疡'
  },
  {
    name: 'mass_any',
    title: '包块/肿块',
    dimension: '部位',
    ask: '是不是身上能摸到包块、肿块或者硬结？',
    trigger: ['包块', '肿块', '硬块', '硬结', '结块', '长了个'],
    children: ['fixed_mass', 'hypochondriac_mass', 'lower_abdominal_lump',
      'epigastric_mass_plate', 'abdomen_bulging_mass', 'rufangzhongkuai', 'gaihua_zhongkuai'],
    notIncluded: '水肿（是肿不是块）、关节肿大、淋巴结'
  },
  {
    name: 'skin_any',
    title: '皮肤异常',
    dimension: '部位',
    ask: '是不是皮肤有问题——痒、起疹、干裂、渗水、溃烂或红肿？',
    trigger: ['皮肤', '身上痒', '起疹', '皮疹'],
    children: ['skin_itch_hives', 'skin_scaly', 'skin_yang', 'oozing_skin',
      'spreading_skin_sore', 'guoming_hongzhong', 'wound_injury'],
    notIncluded: '面色/肤色（那是颜色不是皮损）、外伤伤口、内痈'
  },
  {
    name: 'eye_any',
    title: '眼睛异常',
    dimension: '部位',
    ask: '是不是眼睛有不舒服或异常——红、胀、闭合不全、发黑或者流泪？',
    trigger: ['眼', '目'],
    children: ['mu_chi', 'eye_bulging', 'eyes_cannot_close', 'eyes_dark_rims',
      'tearing_eyes', 'yanjing_duoleishui'],
    notIncluded: '视力模糊、眼睑浮肿（那是水肿类）、眼白发黄（属面色/黄疸）'
  },
  {
    name: 'mouth_throat_any',
    title: '口咽部不适',
    dimension: '部位',
    ask: '是不是嘴、嗓子、鼻子这块不舒服——痛、干、长疮、堵、吞咽不顺或者说话不利？',
    trigger: ['咽', '喉', '嗓子', '口腔', '舌头', '鼻子', '说话'],
    children: ['throat_pain', 'throat_dry', 'throat_ulcer', 'throat_lump_foreign',
      'houlongjinsuo', 'tunyankunnan', 'nose_dry', 'kou_jin', 'speech_difficulty',
      'kouchibuqing', 'voice_hoarse', 'tongue_blue',
      // 流鼻血也归「口咽鼻」这一问（它不是独立系统，但必须能被粗筛管住）
      'epistaxis'],
    notIncluded: '呕吐（是吐不是咽部）、口渴、打嗝'
  },
  {
    name: 'limb_any',
    title: '肢体活动异常',
    dimension: '部位',
    ask: '是不是手脚有异常——动不了、抬不起、发麻、无力，或者站不稳、走不了？',
    trigger: ['手脚', '胳膊', '腿', '肢体', '半身', '站不稳', '走不动'],
    children: ['hemiplegia', 'one_arm_weak', 'limb_numbness', 'limb_heavy_powerless',
      'shuangtuiwuli', 'cannot_walk', 'unsteady_stance',
      'finger_arm_swelling_tremor', 'bei_fan_zhang', 'joint_swelling',
      'yaguan_tong', 'jiao_qi_pain'],
    notIncluded: '抽筋痉挛（另归 spasm_any）、手足发冷/发热（归感觉类）、关节疼痛'
  },
  {
    name: 'energy_any',
    title: '乏力/身重',
    dimension: '状态',
    ask: '是不是没劲、提不起精神，或者身上发沉？',
    trigger: ['没劲', '乏力', '提不起', '身重', '发沉', '体力'],
    children: ['low_energy', 'tili_cha', 'body_heavy'],
    notIncluded: '气短（归喘类）、嗜睡（归睡眠）、四肢沉重抬不动（归肢体）'
  },
  {
    name: 'taste_any',
    title: '口中味觉异常',
    dimension: '感觉',
    ask: '是不是嘴里味道不对——发苦、发酸？',
    trigger: ['口苦', '嘴里', '口酸', '味觉'],
    children: ['bitter_taste', 'wei_suan'],
    notIncluded: '口干（是燥不是味）、口臭'
  },
  {
    name: 'gyneco_any',
    title: '妇科/生殖方面异常',
    dimension: '部位',
    ask: '是不是月经、白带、下阴、精液或生育方面有问题？',
    trigger: ['月经', '经水', '白带', '恶露', '下阴', '前阴', '阴部', '精液', '遗精', '生殖'],
    children: ['amenorrhea', 'yuejingjianshao', 'vaginal_bleeding', 'vaginal_discharge',
      'vulvar_cold', 'yin_chui', 'buyun', 'genital_cold', 'genital_ulcer',
      'semen_loss', 'dream_sex', 'testicle_alternating_swelling', 'jingzixishao',
      'lochia_retention', 'tongjing', 'anal_ulcer', 'blood_clot_dark'],
    notIncluded: '怀孕/产后的状态本身（是状态不是异常）；阴部水肿（归水肿）'
  },
  {
    name: 'emaciation_any',
    title: '形体衰退（消瘦、脱发、白发）',
    dimension: '状态',
    ask: '是不是人瘦下去了、掉头发或者长白头发？',
    trigger: ['消瘦', '瘦了', '掉头发', '脱发', '白发'],
    children: ['weight_loss', 'tuofa', 'baifa'],
    notIncluded: '乏力（归 energy_any）、食欲差（归食欲）'
  },
  {
    name: 'lowback_any',
    title: '腰腿不适',
    dimension: '部位',
    ask: '是不是腰或者腰腿这一带不舒服——酸、困、发凉？',
    trigger: ['腰', '腿酸', '腰腿'],
    children: ['yaosuan', 'yaotuisuankun', 'lower_back_cold'],
    notIncluded: '腰痛如刺（痛归 pain_any）、小腿发凉（可另归 cold_any）'
  },
  {
    name: 'reproductive_state_any',
    title: '孕产状态',
    dimension: '状态',
    ask: '是不是正在怀孕，或者刚生完孩子？',
    trigger: ['怀孕', '妊娠', '产后', '坐月子', '生完'],
    children: ['pregnancy', 'postpartum'],
    notIncluded: '这是状态不是异常；孕吐、恶露等另有专门症状'
  },
  {
    name: 'head_body_pain_any',
    title: '头颈身肢疼痛',
    dimension: '部位',
    // 为什么单独建：pain_any 是「全部位疼痛」，含胸腹的痛。
    // 系统层要按身体区域划分，「头身」不能把腹痛算进去，所以这里只收头颈身肢的痛。
    ask: '是不是头、颈、身上或者手脚有关节疼痛？',
    trigger: ['头痛', '头疼', '项痛', '颈痛', '身上痛', '身痛', '关节痛', '腰腿痛', '足跟痛'],
    children: ['headache', 'neck_stiff_pain', 'body_pain', 'body_ache_stiff',
      'joint_pain_rigid', 'joint_pain_severe', 'migratory_pain', 'yaguan_tong',
      'fengchi_tong', 'zugengtong'],
    notIncluded: '胸腹部的痛（归胸腹系统）、腰酸（酸不是痛，归 lowback_any）'
  }
]

module.exports = { GROUPS }
