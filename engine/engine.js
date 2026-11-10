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

// 医案里极常见的阴性表述（「无汗」「没有腹泻」「不渴」「未见发热」「否认腹痛」）。
// 以前只有 negate() 里手写过的词才认得，于是「无腹泻」会把 diarrhea 判成 yes，
// 进而误点亮葛根汤/小青龙汤这类依赖下利的方子。这里在引擎层统一兜一层否定前缀。
const NEG_CUE_END = /(否认|未见|无明显|没有|无|沒|没|未|不|非)$/
const NEG_CUE_NEAR = /(否认|未见|无明显|没有)[^，。；,.;、:：\n]{0,4}$/

function negatedBefore(text, index) {
  const w = text.slice(Math.max(0, index - 6), index)
  if (!w) return false
  if (NEG_CUE_END.test(w)) return true
  return NEG_CUE_NEAR.test(w)
}

// 从插件 trigger / negate 函数源码里抠出关键词（和 dev/lib/graph.js 的抠法一致）
const kwCache = new WeakMap()
function keywordsOf(def, which = 'trigger') {
  if (!def || typeof def[which] !== 'function') return []
  const cacheKey = which
  if (!kwCache.has(def)) kwCache.set(def, {})
  const box = kwCache.get(def)
  if (box[cacheKey]) return box[cacheKey]
  const out = []
  const src = def[which].toString()
  const m = src.match(/\[([\s\S]*?)\]/)
  if (m) for (const q of m[1].matchAll(/'([^']*)'|"([^"]*)"/g)) out.push(q[1] || q[2])
  box[cacheKey] = out
  return out
}

/**
 * negate() 命中了才算「明确没有」。
 * 但 negate 词自己也可能是被否定的：「没有汗」里的「有汗」是 no_sweat 的否定词，
 * 这里不能因为字面上有「有汗」就判「有汗」。所以逐次命中都过一遍否定前缀检查。
 */
function negateHit(def, text) {
  if (typeof def.negate !== 'function' || !def.negate(text)) return false
  const kws = keywordsOf(def, 'negate')
  if (!kws.length) return true
  for (const kw of kws) {
    if (!kw) continue
    let i = text.indexOf(kw)
    while (i !== -1) {
      if (!negatedBefore(text, i)) return true
      i = text.indexOf(kw, i + Math.max(1, kw.length))
    }
  }
  return kws.length === 0
}

/** trigger 命中了，但要看它是被肯定还是被否定：'positive' | 'negated' */
function polarityOf(def, text) {
  const kws = keywordsOf(def)
  const positives = []
  const negRanges = []
  for (const kw of kws) {
    if (!kw) continue
    let i = text.indexOf(kw)
    while (i !== -1) {
      const end = i + kw.length
      if (negatedBefore(text, i)) negRanges.push([i, end])
      else positives.push([i, end])
      i = text.indexOf(kw, i + Math.max(1, kw.length))
    }
  }
  // 「无气喘」里「气喘」被否定、但更短的「喘」也会命中——被否定的区间盖住的一律不算阳性
  const covered = ([s, e]) => negRanges.some(([ns, ne]) => ns <= s && e <= ne)
  if (positives.some(r => !covered(r))) return 'positive'
  if (negRanges.length) return 'negated'
  if (positives.length) return 'positive'
  return 'positive'   // 关键词没抠出来（非标准写法）→ 维持老行为
}

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

  /** 症状筛选组（上位节点）：只做粗筛，不参与 needs 推理 */
  isGroup(def) {
    return !!def && def.kind === 'symptom_group'
  }

  // 喂入一条病人话，返回本轮状态变化的对象名集合
  feed(utterance) {
    const changed = new Set()
    const text = String(utterance === undefined || utterance === null ? '' : utterance)
    // 先直接喂入 trigger/negate
    for (const name of Object.keys(this.registry)) {
      const def = this.registry[name]
      const group = this.isGroup(def)
      // 症状组永不被判 no：只否定了某个子类，不等于否定了整个大类
      if (!group && negateHit(def, text)) {
        this.set(name, 'no', changed)
        continue
      }
      if (typeof def.trigger !== 'function' || !def.trigger(text)) continue
      // trigger 命中还要看前面有没有「无 / 没有 / 不 / 未见 / 否认」这类否定词
      if (polarityOf(def, text) === 'negated') {
        if (!group) this.set(name, 'no', changed)
      } else {
        this.set(name, 'yes', changed)
      }
    }
    // 再传播 needs + 症状组汇入
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
    // 重新遍历所有 needs 对象 + 症状组汇入，直到没有变化
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
      // 症状组汇入：任一子症状为 yes ⇒ 组为 yes。
      // 子症状为 no **不影响**组——只否定了一个子类，不等于否定整个大类；
      // 组也不会因此变 no，永远只有 yes / unknown 两态。
      for (const name of Object.keys(this.registry)) {
        const def = this.registry[name]
        if (!this.isGroup(def)) continue
        if (!Array.isArray(def.children) || def.children.length === 0) continue
        if (this.state[name] === 'yes') continue
        if (def.children.some(c => this.state[c] === 'yes')) {
          this.state[name] = 'yes'
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
