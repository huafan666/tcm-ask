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
  }

  // 标记某个叶子已问过(用户答"不知道"→unknown)，下次不再问同一个
  markAsked(leaf) {
    this.asked.add(leaf)
  }

  resetAsked() {
    this.asked.clear()
    this.groupAskedCount = 0
    this.focus.clear()
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

  // 推荐下一个反问：先用「症状筛选组」做部位/大类粗筛，再落到具体症状
  nextQuestion() {
    const { cands, count } = this.leafDiscrimination()
    if (cands.length === 0) return null
    const unknownLeaves = Object.keys(count)
      .filter(lf => this.engine.state[lf] === 'unknown' && !this.asked.has(lf))
      .sort((a, b) => (count[b] - count[a]))  // 区分度高者在前
    if (unknownLeaves.length === 0) return null

    const unknownSet = new Set(unknownLeaves)

    // ---- 若已锁定区域：只在区域内的子症状里细化，不再问别的组 ----
    if (this.focus.size) {
      const inFocus = new Set()
      for (const g of this.focus) {
        for (const c of this.childrenOf(g)) if (unknownSet.has(c)) inFocus.add(c)
      }
      if (inFocus.size) {
        const leaf = unknownLeaves.find(lf => inFocus.has(lf))
        const def = this.registry[leaf]
        return {
          leaf, isGroup: false, inFocus: true,
          title: def.title,
          phrase: (def.ask && def.ask.length) ? def.ask : def.title,
          count: count[leaf], total: cands.length
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
    const leaf = unknownLeaves[0]
    const def = this.registry[leaf]
    return {
      leaf,
      isGroup: false,
      title: def.title,
      // 多角度描述：优先用插件自带 ask 口语描述，否则用 title
      phrase: (def.ask && def.ask.length) ? def.ask : def.title,
      count: count[leaf],
      total: cands.length
    }
  }
}

module.exports = { Asker }
