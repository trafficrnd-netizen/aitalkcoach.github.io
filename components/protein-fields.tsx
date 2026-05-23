'use client'

import { CATEGORY_TREE } from '@/lib/categories'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PROTEIN_NODES = CATEGORY_TREE.protein

const SPECIES_OPTIONS = [
  { value: 'human', label: 'Human' },
  { value: 'mouse', label: 'Mouse' },
  { value: 'rat', label: 'Rat' },
  { value: 'rabbit', label: 'Rabbit' },
  { value: 'other', label: 'Other / N/A' },
]

const PURITY_OPTIONS = [
  { value: 'research', label: 'Research Grade' },
  { value: 'gt90', label: '>90%' },
  { value: 'gt95', label: '>95%' },
  { value: 'gt99', label: '>99%' },
  { value: 'gmp', label: 'GMP Grade' },
]

const STORAGE_OPTIONS = [
  { value: '-80', label: '-80°C' },
  { value: '-20', label: '-20°C' },
  { value: '4', label: '4°C' },
  { value: 'rt', label: 'RT' },
]

const APPLICATION_OPTIONS = [
  { value: 'wb', label: 'WB' },
  { value: 'if', label: 'IF/ICC' },
  { value: 'elisa', label: 'ELISA' },
  { value: 'ip', label: 'IP/Co-IP' },
  { value: 'flow', label: 'Flow Cytometry' },
  { value: 'ihc', label: 'IHC' },
  { value: 'chip', label: 'ChIP' },
]

interface Props {
  subCategory: string
  setSubCategory: (v: string) => void
  species: string
  setSpecies: (v: string) => void
  tag: string
  setTag: (v: string) => void
  purity: string
  setPurity: (v: string) => void
  applications: string[]
  setApplications: (v: string[]) => void
  storageTemp: string
  setStorageTemp: (v: string) => void
}

export function ProteinFields({
  subCategory, setSubCategory,
  species, setSpecies,
  tag, setTag,
  purity, setPurity,
  applications, setApplications,
  storageTemp, setStorageTemp,
}: Props) {
  function toggleApp(val: string) {
    setApplications(
      applications.includes(val)
        ? applications.filter(a => a !== val)
        : [...applications, val]
    )
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">단백질·펩타이드 시약 상세 정보</p>

      {/* 서브카테고리 — 2단계 계층 선택 */}
      <div className="space-y-1.5">
        <Label className="text-sm">단백질 분류 <span className="text-destructive">*</span></Label>
        <Select value={subCategory} onValueChange={v => setSubCategory(v ?? '')}>
          <SelectTrigger>
            <SelectValue placeholder="분류 선택" />
          </SelectTrigger>
          <SelectContent>
            {PROTEIN_NODES.map(parent => (
              <div key={parent.code}>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{parent.label}</div>
                {parent.children?.map(child => (
                  <SelectItem key={child.code} value={child.code} className="pl-5">
                    {child.label}
                  </SelectItem>
                )) ?? (
                  <SelectItem value={parent.code} className="pl-5">{parent.label}</SelectItem>
                )}
              </div>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="itemSubType" value={subCategory} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 종(species) */}
        <div className="space-y-1.5">
          <Label className="text-sm">유래 종 (Species)</Label>
          <Select value={species} onValueChange={v => setSpecies(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {SPECIES_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="proteinSpecies" value={species} />
        </div>

        {/* 순도 */}
        <div className="space-y-1.5">
          <Label className="text-sm">순도 등급</Label>
          <Select value={purity} onValueChange={v => setPurity(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {PURITY_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="proteinPurity" value={purity} />
        </div>
      </div>

      {/* 태그·라벨 */}
      <div className="space-y-1.5">
        <Label className="text-sm">태그·라벨 <span className="text-xs text-muted-foreground">(선택)</span></Label>
        <Input
          name="proteinTag"
          value={tag}
          onChange={e => setTag(e.target.value)}
          placeholder="예: His-tag, GST, Biotin, FITC, 무표지"
        />
      </div>

      {/* 적용 분야 (multiselect 체크박스) */}
      <div className="space-y-1.5">
        <Label className="text-sm">적용 분야 <span className="text-xs text-muted-foreground">(복수 선택 가능)</span></Label>
        <div className="flex flex-wrap gap-2">
          {APPLICATION_OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => toggleApp(o.value)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                applications.includes(o.value)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:border-primary'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="proteinApplications" value={applications.join(',')} />
      </div>

      {/* 보관 조건 */}
      <div className="space-y-1.5">
        <Label className="text-sm">요구 보관 조건</Label>
        <Select value={storageTemp} onValueChange={v => setStorageTemp(v ?? '')}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="선택" />
          </SelectTrigger>
          <SelectContent>
            {STORAGE_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="proteinStorage" value={storageTemp} />
      </div>
    </div>
  )
}
