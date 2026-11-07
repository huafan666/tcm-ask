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
  }

  // 标记某个叶子已问过(用户答"不知道"→unknown)，下次不再问同一个
  markAsked(leaf) {
    this.asked.add(leaf)
  }

  resetAsked() {
    this.asked.clear()
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

  // 推荐下一个反问的底层症状（区分度最高，且自身当前是 unknown）
  nextQuestion() {
    const { cands, count } = this.leafDiscrimination()
    if (cands.length === 0) return null
    const unknownLeaf = Object.keys(count)
      .filter(lf => this.engine.state[lf] === 'unknown' && !this.asked.has(lf))
      .sort((a, b) => (count[b] - count[a]))  // 区分度高者在前
    if (unknownLeaf.length === 0) {
      // 没有可问的叶子了，但还有其他候选 → 无法进一步区分（多解）
      return null
    }
    const best = unknownLeaf[0]
    const def = this.registry[best]
    return {
      leaf: best,
      title: def.title,
      // 多角度描述：优先用插件自带 ask 口语描述，否则用 title
      phrase: (def.ask && def.ask.length) ? def.ask : def.title,
      count: count[best],
      total: cands.length
    }
  }
}

module.exports = { Asker }
