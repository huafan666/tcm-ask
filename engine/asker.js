// engine/asker.js
// 问诊器：在多个候选方/证时，挑一个"底层症状"反问病人，以最快收敛。
//
// 概念：
//   - 底层症状(leaf)：有 trigger 的对象（病人能直接回答的具体症状/脉象）
//   - 候选方(candidates)：当前"仍有可能成立"的方剂/证（needs 未被明确阻断）
//   - 区分度：一个底层症状能同时判别多少候选方。区分度最高者优先反问。
//
// 反问流程（循环）：
//   病人答 yes/no/unknown → 更新状态 → 重新筛选 → 若还没唯一则再问下一个。

class Asker {
  constructor(engine) {
    this.engine = engine
    this.registry = engine.registry
    this.asked = new Set()   // 已问过(答"不知道")的叶子，跳过不再重复问
    // 粗筛阶段最多先问几个「症状筛选组」（部位/大类）问题
    this.maxGroupQuestions = 4
    this.groupAskedCount = 0
    // 病人答「是」的筛选组 → 后续只在这个区域内细化，避免到处乱问
    this.focus = new Set()
    // 每个聚焦组最多问几个细化问题（防止一组 20 多个子症状把病人问崩）
    this.maxFocusQuestionsPerGroup = 6
    this._focusAsked = new Map()
    // 每个系统最多细化几个子症状（防止一个大系统把病人问崩）
    this.maxSystemDetailPerSystem = 5
    this._sysDetailAsked = new Map()
    // 「闸门答了有、但病人没具体说是哪一种」的系统 → 需要追问
    this._gateYes = new Set()
  }

  /**
   * 系统闸门被答「有」时调用：记下来，稍后追问几个关键子症状。
   *
   * 另外把该系统的「代表症状」直接点亮——用户说过：
   *   「出汗的问题同一个就可以了」
   * 闸门问的就是「是不是身上会出汗」，病人答「有」，
   * 就没必要再拿「是不是身上有汗」（sweat）重问一遍；
   * 反过来「是不是完全不出汗」（no_sweat）也已经被互斥约束判成否了。
   */
  markGateYes(sysName) {
    const d = this.registry[sysName]
    if (!d || !d.isSystem) return
    this._gateYes.add(sysName)
    const rep = d.rep
    if (rep && this.registry[rep] && this.engine.state[rep] === 'unknown') {
      this.engine.setDirect(rep, 'yes')
    }
  }

  /* ---------------- 「先上位、后下位」 ---------------- */
  /** 这个症状是哪个更笼统症状的更具体一种？（查 SPECIALIZE 反查表） */
  parentOf(leaf) {
    const map = this.engine.parentOf || {}
    return map[leaf] || null
  }

  /**
   * 上位还没定的时候，必须先问上位。
   * 用户原话：「先判断是不是便秘，再判断确实有便秘的情况下，是不是轻度，
   *            这样问比较合适」
   * 否则会出现「一上来就问轻度便秘，病人还没答有没有便秘」的荒谬顺序。
   * 返回应该改问的上位名；不需要改则返回 null。
   */
  promoteToParent(leaf) {
    const p = this.parentOf(leaf)
    if (!p) return null
    const d = this.registry[p]
    if (!d || d.kind !== 'symptom') return null
    if (this.engine.state[p] !== 'unknown') return null   // 已确定 yes/no → 不用再问
    if (this.asked.has(p)) return null                    // 已经问过但病人说不好 → 不再逼问
    return p
  }

  // 标记某个叶子已问过(用户答"不知道"→unknown)，下次不再问同一个
  markAsked(leaf) {
    this.asked.add(leaf)
  }

  resetAsked() {
    this.asked.clear()
    this.groupAskedCount = 0
    this.focus.clear()
    this._focusAsked.clear()
    this._sysDetailAsked.clear()
    this._gateYes.clear()
  }

  /** 病人对某一组答「是」：锁定该区域，后续优先在该组的子症状里细化 */
  focusGroup(name) {
    if (this.registry[name] && this.registry[name].kind === 'symptom_group') this.focus.add(name)
  }

  /** 一组下面的所有子症状（用于聚焦时限定范围） */
  childrenOf(name) {
    const d = this.registry[name]
    return d && Array.isArray(d.children) ? d.children : []
  }

  // 该方是否依赖脉象（当前不做脉，这类方先放一边）
  dependsOnPulse(name) {
    const def = this.registry[name]
    if (!def.needs) return false
    const paths = this.engine.normalizeNeeds(def.needs)
    for (const path of paths) {
      for (const cond of path) {
        const dep = this.engine.splitRef(cond)[0]
        const d = this.registry[dep]
        if (d && d.kind === 'pulse') return true
      }
    }
    return false
  }

  // 该方是否与"当前已确认(yes)"的症状有交集(needs含至少一个已确认yes的对象)
  overlapsConfirmed(name) {
    const def = this.registry[name]
    if (!def.needs) return false
    const paths = this.engine.normalizeNeeds(def.needs)
    for (const path of paths) {
      for (const cond of path) {
        const dep = this.engine.splitRef(cond)[0]
        if (this.engine.state[dep] === 'yes') return true
      }
    }
    return false
  }

  // 返回当前"仍可能成立"的候选方（只盯方层 kind:'formula'，未被明确阻断，不依赖脉象）
  // 候选=所有"条件未被证伪"的方(未阻断即可)，宁多勿漏(避免从单一入口漏掉重症方)
  candidates() {
    const list = []
    for (const name of Object.keys(this.registry)) {
      const def = this.registry[name]
      if (def.kind !== 'formula') continue        // 只盯方层
      if (!def.needs || def.needs.length === 0) continue
      if (this.dependsOnPulse(name)) continue     // 靠脉判的方先放一边
      if (this.isBlocked(name)) continue
      list.push(name)
    }
    return list
  }

  // 该对象是否已被明确阻断（所有路径都被某个 no/yes 冲突卡死）
  isBlocked(name) {
    const def = this.registry[name]
    if (!def.needs) return false
    const paths = this.engine.normalizeNeeds(def.needs)
    // 所有路径都不可行才算阻断
    for (const path of paths) {
      if (this.pathPossible(path)) return false
    }
    return true
  }

  // 一条路径是否仍可能（所有元素都不被明确满足的反面否定）
  pathPossible(path) {
    for (const cond of path) {
      const res = this.engine.evalCond(cond)
      if (res === false) return false
    }
    return true
  }

  // 收集该方需要的所有底层症状（从 needs 各级展开）。排除脉象(kind:'pulse')
  requiredLeaves(name) {
    const def = this.registry[name]
    const leaves = new Set()
    if (!def.needs) return leaves
    const paths = this.engine.normalizeNeeds(def.needs)
    for (const path of paths) {
      for (const cond of path) {
        const dep = this.engine.splitRef(cond)[0]
        const d = this.registry[dep]
        if (d && d.trigger && d.kind !== 'pulse') leaves.add(dep)   // 是底层症状且非脉象
      }
    }
    return leaves
  }

  // 计算所有候选方各自还缺的底层症状，返回"症状 -> 涉及候选数"
  // 区分度 = 该症状在几个候选方中被需要/被否。越多候选依赖它，区分度越高。
  leafDiscrimination() {
    const cands = this.candidates()
    const count = {}
    for (const name of cands) {
      const leaves = this.requiredLeaves(name)
      for (const leaf of leaves) {
        count[leaf] = (count[leaf] || 0) + 1
      }
    }
    return { cands, count }
  }

  /**
   * 一个底层症状属于哪些「症状筛选组」（可多归属）。
   * 组按设计不进 needs，所以必须单独建这张反查表，反问才能看到上位层。
   */
  groupsContaining(leaf) {
    const out = []
    for (const [name, def] of Object.entries(this.registry)) {
      if (def.kind !== 'symptom_group') continue
      if (Array.isArray(def.children) && def.children.includes(leaf)) out.push(name)
    }
    return out
  }

  /**
   * 组的区分度：该组下面**当前还在待问的**子症状各自区分度之和。
   * 用途：当一组里有好几个子症状都要挨个问时，先问一次「你这个是不是呕吐/咽喉这类问题」，
   * 病人答「不是」就能把这一整组候选一次性排掉。
   */
  groupCandidates(leafCount, unknownSet) {
    const out = []
    for (const [name, def] of Object.entries(this.registry)) {
      if (def.kind !== 'symptom_group') continue
      if (this.engine.state[name] !== 'unknown' || this.asked.has(name)) continue
      const kids = Array.isArray(def.children) ? def.children : []
      const live = kids.filter(k => unknownSet.has(k))
      if (live.length < 2) continue                       // 只覆盖一个子症状时，直接问那个子更精确
      const score = live.reduce((s, k) => s + (leafCount[k] || 0), 0)
      if (score === 0) continue                           // 组背后没有候选方，不值得问
      out.push({ name, score, live })
    }
    return out.sort((a, b) => b.score - a.score)
  }

  /* ============================================================
   * 系统层（十问歌顺序）粗筛
   * ------------------------------------------------------------
   * 用户要求：尽早就该定位到关键的地方；例如大便问题一次性就问清楚，
   *          排除掉的就不要再问了；必须统筹所有症状、按人的习惯方式粗筛。
   *
   * 所以问诊顺序不再只按「谁区分度高就问谁」（那样会在系统之间乱跳），而是：
   *   1. 先问「某个系统有没有问题」（闸门问题，答是/否）
   *   2. 答「没有」→ 该系统所有症状一次性判否，后面永不再问
   *   3. 答「有」  → 进入该系统，把它里面的子症状一次问清，问完再走下一个
   *   4. 系统之间的先后：病人已经提到的系统优先，其余按十问歌 order
   * ============================================================ */

  /** 所有系统节点，按 order 排序 */
  systems() {
    const list = []
    for (const [name, d] of Object.entries(this.registry)) {
      if (d.kind !== 'symptom_group' || !d.isSystem) continue
      list.push({ name, def: d, order: typeof d.order === 'number' ? d.order : 999 })
    }
    return list.sort((a, b) => a.order - b.order)
  }

  /** 这个系统还值不值得问：里面至少有一个症状是当前候选方需要的，或已被点亮 */
  systemRelevant(sys, count) {
    const kids = Array.isArray(sys.def.children) ? sys.def.children : []
    return kids.some(k => (count[k] || 0) > 0 || this.engine.state[k] === 'yes')
  }

  /**
   * 选下一个系统问题。
   *   { sys, mode:'gate' }         → 问这个系统有没有问题
   *   { sys, mode:'detail', kid }  → 在系统内细化某个子症状
   *   null                         → 系统层问完，交给后面的区分度逻辑
   */
  nextSystemQuestion(count) {
    const all = this.systems()
    if (!all.length) return null

    // 已经提到过的系统（有子症状为 yes）排在前面
    const touched = s => (s.def.children || []).some(k => this.engine.state[k] === 'yes')
    const ordered = all.slice().sort((a, b) => {
      const ta = touched(a) ? 0 : 1, tb = touched(b) ? 0 : 1
      return ta - tb || a.order - b.order
    })

    // 1) 「答了有、但没具体说」的系统 → 追问几个关键子症状（最多 5 个）
    //    如果这个系统是因为病人自己描述出来的（某个子症状已经 yes），就不再追问，
    //    因为闸门问题本身就是复合问句（「大便干硬？稀溏？带血？还是正常？」），
    //    病人一说就已经把细节给了。
    for (const s of ordered) {
      if (!this._gateYes.has(s.name)) continue
      if (this.engine.state[s.name] !== 'yes') continue
      const cap = this.maxSystemDetailPerSystem || 5
      const done = this._sysDetailAsked.get(s.name) || 0
      if (done >= cap) continue
      const kids = (s.def.children || []).filter(c => {
        const d = this.registry[c]
        return d && d.kind === 'symptom' && this.engine.state[c] === 'unknown' && !this.asked.has(c)
      })
      if (!kids.length) continue
      // 只问「最多候选方会用到」的几个，别把整个系统翻一遍
      kids.sort((a, b) => (count[b] || 0) - (count[a] || 0))
      let pick = kids.find(c => (count[c] || 0) > 0) || kids[0]
      // 先上位、后下位：要问「轻度便秘」之前，先确认有没有便秘
      pick = this.promoteToParent(pick) || pick
      this._sysDetailAsked.set(s.name, done + 1)
      return { sys: s, mode: 'detail', kid: pick }
    }

    // 2) 再问还没碰过的系统（闸门问题），按十问歌顺序
    for (const s of ordered) {
      if (this.engine.state[s.name] !== 'unknown') continue
      if (this.asked.has(s.name)) continue
      if (!this.systemRelevant(s, count)) continue          // 系统里的症状跟剩余候选方无关 → 跳过
      return { sys: s, mode: 'gate' }
    }
    return null
  }

  // 推荐下一个反问：先用「症状筛选组」做部位/大类粗筛，再落到具体症状
  nextQuestion() {
    const { cands, count } = this.leafDiscrimination()
    if (cands.length === 0) return null
    const unknownLeaves = Object.keys(count)
      .filter(lf => this.engine.state[lf] === 'unknown' && !this.asked.has(lf))
      .sort((a, b) => (count[b] - count[a]))  // 区分度高者在前
    if (unknownLeaves.length === 0) return null

    const unknownSet = new Set(unknownLeaves)

    // ---- 第 0 层：系统层（十问歌顺序）----
    // 这是用户要求的核心：按人看病的习惯，一个系统一个系统过；
    // 某个系统答「没有」就整块排除、永不再问；答「有」就把它一次问清。
    const sysQ = this.nextSystemQuestion(count)
    if (sysQ) {
      const s = sysQ.sys
      if (sysQ.mode === 'gate') {
        return {
          leaf: s.name, isGroup: true, isSystem: true, systemTitle: s.def.title,
          title: s.def.title,
          phrase: (s.def.ask && s.def.ask.length) ? s.def.ask : s.def.title,
          count: Math.min(cands.length, (s.def.children || []).reduce((n, k) => n + (count[k] || 0), 0)),
          total: cands.length,
          covers: s.def.children || []
        }
      }
      const d = this.registry[sysQ.kid]
      return {
        leaf: sysQ.kid, isGroup: false, inSystem: s.name, systemTitle: s.def.title,
        title: d.title,
        phrase: (d.ask && d.ask.length) ? d.ask : d.title,
        count: count[sysQ.kid] || 0, total: cands.length
      }
    }

    // ---- 自动细化：某个筛选组已经成立、但它的子症状一个都没确定 ----
    // 典型场景：病人说「睡眠不好」→ sleep_any 成立，但入睡困难/易醒/睡眠浅全都还不知道。
    // 这时候必须先把睡眠往细里问，不能跑去问腹部、寒冷这些无关大类。
    // 注意只在「一个子症状都没确定」时触发：若已确定某个子（如腹痛之于腹部组），
    // 说明病人已经说具体了，不必再把整组翻一遍。
    if (this.focus.size === 0) {
      for (const [name, d] of Object.entries(this.registry)) {
        if (d.kind !== 'symptom_group') continue
        if (this.engine.state[name] !== 'yes') continue
        if (this.asked.has(name)) continue
        const kids = Array.isArray(d.children) ? d.children : []
        // 只把「具体」的子症状算作已确定；笼统描述（vague，如「睡眠不好」）不算，
        // 否则「睡眠不好」自己就把这条判断满足了，永远细化不下去。
        const specific = kids.filter(k => !(this.registry[k] && this.registry[k].vague))
        if (specific.some(k => this.engine.state[k] === 'yes')) continue   // 已经说具体了
        // 用引擎状态判断，而不是 unknownSet ——
        // unknownSet 只含「被某个候选方直接需要」的症状，而细化用的子症状
        // （如入睡困难/容易醒/睡眠浅）目前没有方剂引用，不在里面。
        if (specific.some(k => this.registry[k] && this.engine.state[k] === 'unknown' && !this.asked.has(k))) {
          this.focus.add(name)
        }
      }
    }

    // ---- 若已锁定区域：只在区域内的子症状里细化，不再问别的组 ----
    if (this.focus.size) {
      const cap = this.maxFocusQuestionsPerGroup || 6
      for (const g of this.focus) {
        const askedHere = this._focusAsked.get(g) || 0
        if (askedHere >= cap) continue
        // 细化顺序也按区分度排：先问最能分开候选方的那个子症状，
        // 而不是照 children 里的书写顺序从第一个问到最后一个。
        const kids = this.childrenOf(g)
          .filter(c => this.engine.state[c] === 'unknown' && !this.asked.has(c))
          .sort((a, b) => (count[b] || 0) - (count[a] || 0))
        if (!kids.length) continue
        // 先上位、后下位：要问「轻度便秘」之前，先确认有没有便秘
        const c = this.promoteToParent(kids[0]) || kids[0]
        // 细化用的子症状**不要求**被某个方剂直接需要（count 可能是 0）——
        // 例如「入睡困难/容易醒/睡眠浅」目前没有方剂直接引用，
        // 但病人说了「睡眠不好」就必须先问清是哪一种，否则初筛等于没做。
        const def = this.registry[c]
        this._focusAsked.set(g, askedHere + 1)
        return {
          leaf: c, isGroup: false, inFocus: true,
          title: def.title,
          phrase: (def.ask && def.ask.length) ? def.ask : def.title,
          count: count[c] || 0, total: cands.length
        }
      }
      // 区域内已经没有能问的了 → 解除锁定，回到全局
      this.focus.clear()
    }

    // ---- 第一层：症状筛选组（部位 / 大类）粗筛 ----
    // 只在粗筛阶段、且这一组下面有 ≥2 个待问子症状、合计区分度不低于最强单个子症状时才问。
    // 答「是」→ 锁定该区域继续细化；答「否」→ 整组子症状一次性排除。
    if (this.groupAskedCount < this.maxGroupQuestions) {
      const groups = this.groupCandidates(count, unknownSet)
      const bestLeafCount = count[unknownLeaves[0]]
      const best = groups.find(g => g.score >= bestLeafCount)
      if (best) {
        const def = this.registry[best.name]
        return {
          leaf: best.name,
          isGroup: true,
          title: def.title,
          phrase: (def.ask && def.ask.length) ? def.ask : def.title,
          count: best.score,
          total: cands.length,
          covers: best.live
        }
      }
    }

    // ---- 第二层：具体症状 ----
    // 先上位、后下位：如果最该问的这个症状还挂着没定的上位，就先问上位
    //（用户：先判断是不是便秘，再判断是不是轻度）
    let leaf = unknownLeaves[0]
    leaf = this.promoteToParent(leaf) || leaf
    const def = this.registry[leaf]
    return {
      leaf,
      isGroup: false,
      title: def.title,
      // 多角度描述：优先用插件自带 ask 口语描述，否则用 title
      phrase: (def.ask && def.ask.length) ? def.ask : def.title,
      count: count[leaf] || 0,
      total: cands.length
    }
  }
}

module.exports = { Asker }
