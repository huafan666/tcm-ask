// engine/engine.js
// 三态推理引擎
//
// 状态：每个对象有 yes / no / unknown 三态
// 产生 yes 的两条路（"或"）：
//   1) 被 trigger 喂入：病人/医生点名了这个对象 → yes
//      （negate 命中 → no）
//   2) needs 全部满足：引擎按依赖算出 yes
//
// needs 语法（两层）：
//   'fever.yes'   → 对象 fever 必须为 yes
//   'fever.no'    → 对象 fever 必须为 no
//   'fever'       → 简写，等价 fever.yes
//   ['a','b']            → 单路径，路径内 AND
//   [['a','b'],['c','d']]  → 多路径 OR，每条路径内 AND
//
// 传播：当一个对象的 yes/no 变化，重新求值所有它的依赖者，直到稳定。

class Engine {
  constructor(registry) {
    this.registry = registry
    this.state = {}
    // dependents[name] = 依赖 name 的所有对象（含 needs 全展开）
    this.dependents = {}
    for (const name of Object.keys(registry)) {
      this.state[name] = 'unknown'
    }
    for (const name of Object.keys(registry)) {
      this.registerDeps(name)
    }
  }

  // 归一化 needs 为路径数组：'a' / ['a','b'] → [['a','b']]（单路径）；[['a','b'],['c','d']] → 原样
  normalizeNeeds(needs) {
    if (Array.isArray(needs[0])) return needs          // 已是路径数组
    return [needs]                                     // 单路径包一层
  }

  registerDeps(name) {
    const def = this.registry[name]
    if (!def || !def.needs) return
    const paths = this.normalizeNeeds(def.needs)
    for (const path of paths) {
      for (const cond of path) {
        const depName = this.splitRef(cond)[0]
        ;(this.dependents[depName] = this.dependents[depName] || new Set()).add(name)
      }
    }
  }

  // 喂入一条病人话，返回本轮状态变化的对象名集合
  feed(utterance) {
    const changed = new Set()
    // 先直接喂入 trigger/negate
    for (const name of Object.keys(this.registry)) {
      const def = this.registry[name]
      if (typeof def.negate === 'function' && def.negate(utterance)) {
        this.set(name, 'no', changed)
      } else if (typeof def.trigger === 'function' && def.trigger(utterance)) {
        this.set(name, 'yes', changed)
      }
    }
    // 再传播 needs
    this.propagate(changed)
    return Array.from(changed)
  }

  // 直接设置某个对象的状态（供反问选择题用：是→yes / 否→no）
  setDirect(name, val) {
    const changed = new Set()
    if (this.registry[name]) this.set(name, val, changed)
    this.propagate(changed)
    return Array.from(changed)
  }

  set(name, val, changed) {
    if (this.state[name] === val) return
    this.state[name] = val
    if (changed) changed.add(name)
    this.evalDependents(name, changed)
  }

  // 求值所有依赖 name 的对象
  evalDependents(name, changed, seen = new Set()) {
    const deps = this.dependents[name]
    if (!deps) return
    for (const dep of deps) {
      if (seen.has(dep)) continue
      seen.add(dep)
      const prev = this.state[dep]
      this.evalOne(dep, changed)
      // 只有当依赖者状态真的变了，才继续往下传播
      if (this.state[dep] !== prev) {
        this.evalDependents(dep, changed, seen)
      }
    }
  }

  // 求值单个 needs 对象
  evalOne(name) {
    const def = this.registry[name]
    if (!def || !def.needs || def.needs.length === 0) return
    const paths = this.normalizeNeeds(def.needs)
    // 每条路径：路径内 AND；任一路径满足 → 对象 yes
    let anyPathOk = false
    let anyPathBlocked = false
    for (const path of paths) {
      const results = path.map(cond => this.evalCond(cond))
      if (results.every(r => r === true)) {
        anyPathOk = true
        break
      }
      if (results.some(r => r === false)) {
        anyPathBlocked = true
      }
    }
    if (anyPathOk) {
      if (this.state[name] !== 'yes') this.state[name] = 'yes'
    } else if (anyPathBlocked) {
      // 没有路径满足，但所有路径都被某条件明确阻断 → no；否则保持 unknown
      // 简化：只要有一条路径被阻断就视为明确不成立
      if (this.state[name] !== 'no') this.state[name] = 'no'
    }
  }

  propagate(changed) {
    // 重新遍历所有 needs 对象，直到没有变化
    let guard = 0
    while (guard++ < 1000) {
      let any = false
      for (const name of Object.keys(this.registry)) {
        const def = this.registry[name]
        if (!def.needs || def.needs.length === 0) continue
        const prev = this.state[name]
        this.evalOne(name)
        if (this.state[name] !== prev) {
          any = true
          if (changed) changed.add(name)
        }
      }
      if (!any) break
    }
  }

  evalCond(cond) {
    const [n, want] = this.splitRef(cond)
    const s = this.state[n] || 'unknown'
    return s === want ? true : (s === 'unknown' ? 'unknown' : false)
  }

  splitRef(ref) {
    const i = ref.lastIndexOf('.')
    if (i === -1) return [ref, 'yes']
    const verb = ref.slice(i + 1)
    if (verb === 'yes' || verb === 'no') return [ref.slice(0, i), verb]
    return [ref, 'yes']
  }

  // 当前状态快照（只含 yes/no 明确项 + unknown 计数）
  snapshot() {
    const out = {}
    for (const name of Object.keys(this.state)) {
      out[name] = this.state[name]
    }
    return out
  }

  // 收集所有成立(yes)对象的禁忌，返回并集（去重）
  contraindications() {
    const set = new Set()
    for (const name of Object.keys(this.registry)) {
      if (this.state[name] !== 'yes') continue
      const c = this.registry[name].contraindications
      if (Array.isArray(c)) c.forEach(x => set.add(x))
      else if (typeof c === 'string') set.add(c)
    }
    return Array.from(set)
  }

  reset() {
    for (const name of Object.keys(this.state)) this.state[name] = 'unknown'
  }
}

module.exports = { Engine }
