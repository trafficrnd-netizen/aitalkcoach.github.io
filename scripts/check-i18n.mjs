#!/usr/bin/env node
/**
 * check-i18n.mjs
 *
 * TSX/TS 파일에서 JSX 텍스트 노드·속성에 한글이 하드코딩된 경우를 감지합니다.
 * pre-commit hook, CI, npm script 에서 실행합니다.
 *
 * 사용:
 *   node scripts/check-i18n.mjs              # 전체 app/ + components/ 검사
 *   node scripts/check-i18n.mjs --staged     # git staged 파일만 (pre-commit용)
 */

import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STAGED_ONLY = process.argv.includes('--staged')

// ── 검사 제외 경로 ──────────────────────────────────────────────
const IGNORE_PATHS = [
  'node_modules', '.next', 'scripts', 'public',
  join('lib', 'i18n'),
  join('lib', 'categories'),
  join('lib', 'equipment-specs'),
  join('lib', 'payment-terms'),
  join('lib', 'supply-keywords'),
  join('lib', 'protein-keywords'),
]

// ── 패턴 ────────────────────────────────────────────────────────
// JSX 텍스트 노드 >...한글...<
const RE_JSX_TEXT  = />\s*([^{<>\n]*[가-힣]{2,}[^{<>\n]*)\s*</g
// placeholder / aria-label / title / alt 속성의 한글 (t() 미사용)
const RE_ATTR_KO   = /(?:placeholder|aria-label|title|alt)="([^"]*[가-힣]{2,}[^"]*)"/g
// setError('한글') — 에러 메시지 하드코딩
const RE_SET_ERROR = /setError\(['"]([^'"]*[가-힣]{2,}[^'"]*)['"]\)/g

function getTargetFiles() {
  if (STAGED_ONLY) {
    try {
      const out = execSync('git diff --cached --name-only --diff-filter=ACM', { cwd: ROOT })
        .toString().trim()
      return out
        .split('\n')
        .filter(f => /\.(tsx|ts)$/.test(f) && !IGNORE_PATHS.some(p => f.includes(p)))
        .map(f => join(ROOT, f))
        .filter(f => existsSync(f))
    } catch {
      return []
    }
  }

  const result = []
  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (IGNORE_PATHS.some(p => full.includes(p))) continue
      try {
        const stat = statSync(full)
        if (stat.isDirectory()) walk(full)
        else if (/\.(tsx|ts)$/.test(entry)) result.push(full)
      } catch { /* skip */ }
    }
  }
  walk(join(ROOT, 'app'))
  const compDir = join(ROOT, 'components')
  if (existsSync(compDir)) walk(compDir)
  return result
}

let totalViolations = 0
const files = getTargetFiles()

for (const file of files) {
  const src = readFileSync(file, 'utf-8')
  const relPath = file.replace(ROOT + '/', '')
  const issues = []

  const lineOf = (idx) => src.slice(0, idx).split('\n').length

  for (const m of src.matchAll(RE_JSX_TEXT)) {
    const text = m[1].trim()
    if (!text) continue
    // t() 표현식이 포함되어 있으면 skip
    if (text.includes('t(') || text.startsWith('{')) continue
    issues.push({ line: lineOf(m.index), text: text.slice(0, 70), type: 'JSX text' })
  }

  for (const m of src.matchAll(RE_ATTR_KO)) {
    issues.push({ line: lineOf(m.index), text: m[1].slice(0, 70), type: 'attr' })
  }

  for (const m of src.matchAll(RE_SET_ERROR)) {
    issues.push({ line: lineOf(m.index), text: m[1].slice(0, 70), type: 'setError' })
  }

  if (issues.length > 0) {
    console.log(`\n⚠  ${relPath}`)
    issues.slice(0, 5).forEach(({ line, text, type }) =>
      console.log(`   L${line} [${type}]: ${text}`)
    )
    if (issues.length > 5) console.log(`   ... (${issues.length - 5}개 더)`)
    totalViolations += issues.length
  }
}

if (totalViolations > 0) {
  console.log(`\n❌  하드코딩된 한글 ${totalViolations}건 — lib/i18n/dictionary.ts 에 키를 추가하고 t('key') 로 교체하세요.`)
  process.exit(1)
} else {
  const count = files.length
  console.log(`✅  ${count}개 파일 검사 완료 — 하드코딩된 한글 없음`)
}
