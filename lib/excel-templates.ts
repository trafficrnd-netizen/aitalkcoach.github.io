import * as XLSX from 'xlsx'

// ─────────────────────────────────────────
// RESEARCHER — blank template downloads
// ─────────────────────────────────────────

export function downloadReagentTemplate() {
  const wb = XLSX.utils.book_new()

  const headers = [
    '번호', '물질명 (*필수)', 'CAS 번호', '분자식',
    '순도/등급', '용량 규격', '수량 (*필수)', '단위 (*필수)', '품목 메모',
  ]
  const example = [
    1, 'Ethanol', '64-17-5', 'C2H6O',
    '99.9%, ACS grade', '500mL 병', 500, 'mL', '예시행 — 삭제 후 입력',
  ]
  const blanks = Array.from({ length: 19 }, (_, i) => [i + 2, '', '', '', '', '', '', 'mL', ''])

  const ws = XLSX.utils.aoa_to_sheet([headers, example, ...blanks])
  ws['!cols'] = [
    { wch: 5 }, { wch: 32 }, { wch: 15 }, { wch: 12 },
    { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 8 }, { wch: 28 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, '시약 견적요청')
  XLSX.writeFile(wb, '시약_견적요청_양식.xlsx')
}

export function downloadProteinTemplate() {
  const wb = XLSX.utils.book_new()

  const headers = [
    '번호', '제품명/단백질명 (*필수)', '분류 (예: 사이토카인)',
    '유래 종 (Human/Mouse/Rat 등)', '순도 등급 (예: >95%)', '태그·라벨 (예: His-tag)',
    '적용 분야 (WB/ELISA/IF 등)', '보관 조건 (-80°C/-20°C/4°C/RT)',
    '수량 (*필수)', '단위 (*필수)', '품목 메모',
  ]
  const example = [
    1, 'IL-6 (Interleukin-6)', '사이토카인·인터루킨',
    'Human', '>95%', '없음(tag-free)',
    'ELISA, WB', '-80°C',
    10, 'μg', '예시행 — 삭제 후 입력',
  ]
  const blanks = Array.from({ length: 19 }, (_, i) => [i + 2, '', '', '', '', '', '', '', '', 'μg', ''])

  const ws = XLSX.utils.aoa_to_sheet([headers, example, ...blanks])
  ws['!cols'] = [
    { wch: 5 }, { wch: 32 }, { wch: 22 }, { wch: 22 }, { wch: 15 }, { wch: 18 },
    { wch: 25 }, { wch: 22 }, { wch: 10 }, { wch: 8 }, { wch: 28 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, '단백질펩타이드 견적요청')
  XLSX.writeFile(wb, '단백질펩타이드_견적요청_양식.xlsx')
}

export function downloadSupplyTemplate() {
  const wb = XLSX.utils.book_new()

  const headers = [
    '번호', '제품명 (*필수)', '대분류 (소모품 또는 실험기구)',
    '세부분류 (예: 튜브·용기, 유리기구)', '수량 (*필수)', '단위 (*필수)', '품목 메모',
  ]
  const example = [
    1, '마이크로튜브 1.5mL', '소모품',
    '튜브·용기', 500, 'ea', '예시행 — 삭제 후 입력',
  ]
  const blanks = Array.from({ length: 19 }, (_, i) => [i + 2, '', '', '', '', 'ea', ''])

  const ws = XLSX.utils.aoa_to_sheet([headers, example, ...blanks])
  ws['!cols'] = [
    { wch: 5 }, { wch: 32 }, { wch: 20 }, { wch: 28 }, { wch: 10 }, { wch: 8 }, { wch: 28 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, '소모품실험기구 견적요청')
  XLSX.writeFile(wb, '소모품실험기구_견적요청_양식.xlsx')
}

// ─────────────────────────────────────────
// RESEARCHER — parse uploaded Excel
// ─────────────────────────────────────────

export interface ParsedBatchItem {
  substanceName: string
  casNumber: string
  qty: string
  unit: string
  purity: string
  volume: string
  note: string
  itemType: 'reagent' | 'protein' | 'supply'
  itemSubType: string
  supplyTopType: '' | 'consumable' | 'labware'
}

function isExampleRow(cells: unknown[]): boolean {
  return cells.some(c => String(c ?? '').includes('예시행'))
}

export async function parseResearcherExcel(
  file: File,
  type: 'reagent' | 'protein' | 'supply',
): Promise<ParsedBatchItem[]> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })

  // Skip header (row 0) and any example rows
  const dataRows = rows
    .slice(1)
    .filter(row => !isExampleRow(row as unknown[]))

  const items: ParsedBatchItem[] = []

  for (const row of dataRows) {
    const r = row as unknown[]
    if (type === 'reagent') {
      const name = String(r[1] ?? '').trim()
      const qty = String(r[6] ?? '').trim()
      if (!name || !qty || Number(qty) <= 0) continue
      items.push({
        itemType: 'reagent',
        itemSubType: '',
        supplyTopType: '',
        substanceName: name,
        casNumber: String(r[2] ?? '').trim(),
        qty,
        unit: String(r[7] ?? 'mL').trim() || 'mL',
        purity: String(r[4] ?? '').trim(),
        volume: String(r[5] ?? '').trim(),
        note: String(r[8] ?? '').trim(),
      })
    } else if (type === 'protein') {
      const name = String(r[1] ?? '').trim()
      const qty = String(r[8] ?? '').trim()
      if (!name || !qty || Number(qty) <= 0) continue
      items.push({
        itemType: 'protein',
        itemSubType: '',
        supplyTopType: '',
        substanceName: name,
        casNumber: '',
        qty,
        unit: String(r[9] ?? 'μg').trim() || 'μg',
        purity: String(r[4] ?? '').trim(),
        volume: '',
        note: String(r[10] ?? '').trim(),
      })
    } else {
      // supply
      const name = String(r[1] ?? '').trim()
      const qty = String(r[4] ?? '').trim()
      if (!name || !qty || Number(qty) <= 0) continue
      const topRaw = String(r[2] ?? '').trim()
      items.push({
        itemType: 'supply',
        itemSubType: '',
        supplyTopType: topRaw.includes('실험기구') ? 'labware' : 'consumable',
        substanceName: name,
        casNumber: '',
        qty,
        unit: String(r[5] ?? 'ea').trim() || 'ea',
        purity: '',
        volume: '',
        note: String(r[6] ?? '').trim(),
      })
    }
  }

  return items
}

// ─────────────────────────────────────────
// SUPPLIER — pre-filled quote template download
// ─────────────────────────────────────────

export interface SupplierQuoteRequestItem {
  id: string
  substance_name: string
  cas_number: string | null
  qty: number
  unit: string | null
  purity: string | null
}

// Sentinel in col A of the header row — used by the parser to find data start
const HEADER_SENTINEL = '[BidVibe]번호'

export function downloadSupplierQuoteTemplate(
  items: SupplierQuoteRequestItem[],
  requestTitle: string,
) {
  const wb = XLSX.utils.book_new()

  const metaRows = [
    ['BidVibe 공급자 견적서 양식'],
    [`요청: ${requestTitle}`],
    [`작성일: ${new Date().toLocaleDateString('ko-KR')}`],
    ['※ 품목명·수량·단위는 수정하지 마세요. 단가와 납기가능일(*필수)을 입력하세요.'],
    [],
  ]

  const headers = [
    HEADER_SENTINEL, '품목명 (수정불가)', 'CAS번호 (참고)',
    '수량', '단위',
    '단가_원_VAT포함 (*필수)', '납기가능일 (*필수, YYYY-MM-DD)', '브랜드/제조사', '비고',
  ]

  const itemRows = items.map((item, i) => [
    i + 1,
    item.substance_name,
    item.cas_number ?? '',
    item.qty,
    item.unit ?? '',
    '',   // 단가 — supplier fills
    '',   // 납기가능일 — supplier fills
    '',   // 브랜드
    '',   // 비고
  ])

  const ws = XLSX.utils.aoa_to_sheet([...metaRows, headers, ...itemRows])
  ws['!cols'] = [
    { wch: 12 }, { wch: 38 }, { wch: 15 },
    { wch: 8 }, { wch: 8 },
    { wch: 24 }, { wch: 26 }, { wch: 22 }, { wch: 28 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, '견적서')
  const safeName = requestTitle.replace(/[^\w가-힣]/g, '_').slice(0, 20)
  XLSX.writeFile(wb, `견적서_양식_${safeName}.xlsx`)
}

// ─────────────────────────────────────────
// SUPPLIER — parse uploaded quote Excel
// ─────────────────────────────────────────

export interface ParsedBidResult {
  bidItems: { index: number; totalPrice: number; available: boolean }[]
  deliveryDate: string
  memo: string
}

export async function parseSupplierQuoteExcel(file: File): Promise<ParsedBidResult> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })

  // Find header row by sentinel
  const headerIdx = rows.findIndex(row =>
    String((row as unknown[])[0]).includes('[BidVibe]번호'),
  )
  if (headerIdx === -1) throw new Error('견적서 형식이 올바르지 않습니다. BidVibe 양식을 사용하세요.')

  const dataRows = rows.slice(headerIdx + 1).filter(row => {
    const r = row as unknown[]
    return String(r[0]).trim() !== '' && !isNaN(Number(r[0]))
  })

  const bidItems: ParsedBidResult['bidItems'] = []
  const deliveryDates: string[] = []
  const brands: string[] = []

  dataRows.forEach((row, i) => {
    const r = row as unknown[]
    const qty = Number(r[3]) || 1
    const unitPrice = Number(r[5]) || 0
    const deliveryDate = String(r[6] ?? '').trim()
    const brand = String(r[7] ?? '').trim()

    if (deliveryDate) deliveryDates.push(deliveryDate)
    if (brand) brands.push(brand)

    bidItems.push({
      index: i,
      totalPrice: Math.round(unitPrice * qty),
      available: unitPrice > 0,
    })
  })

  const deliveryDate = deliveryDates[0] ?? ''
  const uniqueBrands = brands.filter((b, i, arr) => arr.indexOf(b) === i)
  const memo = uniqueBrands.length > 0 ? `브랜드: ${uniqueBrands.join(', ')}` : ''

  return { bidItems, deliveryDate, memo }
}
