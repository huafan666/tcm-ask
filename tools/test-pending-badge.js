'use strict'
// 用极简 DOM 桩验证 setPendingBadge：加/改/清零时的 DOM 行为
const fs = require('fs')
const path = require('path')

class El {
  constructor (tag) { this.tagName = tag; this.className = ''; this.children = []; this.textContent = ''; this.parent = null }
  appendChild (c) { this.children.push(c); c.parent = this; return c }
  remove () { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this) }
  querySelector (sel) {
    const want = sel.replace(/^\./, '')
    if (this.className === want) return this
    return this.children.find(c => c.className === want) || null
  }
}

const link = new El('a')
link.className = 'nav-item'
global.document = {
  createElement (tag) { return new El(tag) },
  querySelector (sel) { return sel.indexOf('/review') >= 0 ? link : null }
}

const src = fs.readFileSync(path.join(__dirname, '..', 'platform', 'public', 'js', 'shell.js'), 'utf8')
const body = src.match(/export function setPendingBadge\(n\) \{[\s\S]*?\n\}/)[0].replace('export ', '')
const setPendingBadge = new Function('document', body + '; return setPendingBadge;')(global.document)

let pass = 0, fail = 0
const ok = (n, c, extra) => { if (c) { pass++; console.log('  ✓ ' + n) } else { fail++; console.log('  ✗ ' + n + (extra ? ' → ' + extra : '')) } }

setPendingBadge(3)
ok('有待审时出现红点且数字为 3', link.children.length === 1 && link.children[0].textContent === '3', JSON.stringify(link.children.map(c => c.textContent)))

setPendingBadge(1)
ok('待审减少时数字跟着变', link.children.length === 1 && link.children[0].textContent === '1', JSON.stringify(link.children.map(c => c.textContent)))

setPendingBadge(0)
ok('清零时红点被移除（不用刷新）', link.children.length === 0, String(link.children.length))

setPendingBadge(2)
ok('清零后再出现也正常', link.children.length === 1 && link.children[0].textContent === '2', JSON.stringify(link.children.map(c => c.textContent)))

console.log('\n============================================')
console.log(`结果: ${pass} 通过, ${fail} 失败`)
if (fail) process.exitCode = 1
