export type ItemType = 'reagent' | 'protein' | 'supply' | 'equipment'

export interface CategoryNode {
  code: string
  label: string
  children?: CategoryNode[]
}

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  reagent: '시약·화학물질',
  protein: '단백질·펩타이드 시약',
  supply: '소모품·실험기구',
  equipment: '장비·기기',
}

export const ITEM_TYPE_ICONS: Record<ItemType, string> = {
  reagent: '🧪',
  protein: '🧬',
  supply: '📦',
  equipment: '🔬',
}

export const CATEGORY_TREE: Record<ItemType, CategoryNode[]> = {
  reagent: [
    { code: 'reagent.general', label: '일반화학시약' },
    { code: 'reagent.analytical', label: '분석용시약' },
    { code: 'reagent.biochem', label: '생화학시약' },
    { code: 'reagent.cell_culture', label: '세포배양용시약' },
    { code: 'reagent.solvent', label: '유기용매' },
    { code: 'reagent.buffer', label: '버퍼·염' },
    { code: 'reagent.safety', label: '안전용품·시약' },
    { code: 'reagent.other', label: '기타 시약' },
  ],

  protein: [
    {
      code: 'protein.recombinant',
      label: '재조합 단백질',
      children: [
        { code: 'protein.recombinant.cytokine', label: '사이토카인·인터루킨' },
        { code: 'protein.recombinant.gf', label: '성장인자 (EGF/FGF/VEGF)' },
        { code: 'protein.recombinant.receptor', label: '수용체·리간드' },
        { code: 'protein.recombinant.enzyme', label: '효소 (중합효소/프로테아제)' },
        { code: 'protein.recombinant.tf', label: '전사인자' },
        { code: 'protein.recombinant.structural', label: '구조 단백질 (Actin/Tubulin)' },
      ],
    },
    {
      code: 'protein.antibody',
      label: '항체',
      children: [
        { code: 'protein.antibody.primary_mab', label: '1차 항체 (단클론)' },
        { code: 'protein.antibody.primary_pab', label: '1차 항체 (다클론)' },
        { code: 'protein.antibody.secondary', label: '2차 항체' },
        { code: 'protein.antibody.fluorescent', label: '형광표지 항체' },
        { code: 'protein.antibody.hrp', label: 'HRP·AP 표지 항체' },
        { code: 'protein.antibody.recombinant', label: '재조합 항체' },
      ],
    },
    {
      code: 'protein.analysis',
      label: '단백질 분석 키트',
      children: [
        { code: 'protein.analysis.quantification', label: '단백질 정량 (BCA/Bradford)' },
        { code: 'protein.analysis.elisa', label: 'ELISA 키트' },
        { code: 'protein.analysis.wb', label: '웨스턴블롯 시약' },
        { code: 'protein.analysis.ip', label: 'IP / Co-IP 키트' },
        { code: 'protein.analysis.ms', label: '질량분석 시약' },
      ],
    },
    {
      code: 'protein.electrophoresis',
      label: '전기영동 시약',
      children: [
        { code: 'protein.electrophoresis.gel', label: 'PAGE 겔·버퍼' },
        { code: 'protein.electrophoresis.marker', label: '분자량 마커·래더' },
        { code: 'protein.electrophoresis.stain', label: '겔 염색 시약 (Coomassie/Silver)' },
      ],
    },
    {
      code: 'protein.purification',
      label: '단백질 정제 시약',
      children: [
        { code: 'protein.purification.affinity', label: '친화성 정제 (His/GST/FLAG)' },
        { code: 'protein.purification.ion_exchange', label: '이온교환 수지' },
        { code: 'protein.purification.sec', label: '겔여과 수지' },
        { code: 'protein.purification.hic', label: '소수성 수지' },
        { code: 'protein.purification.dialysis', label: '투석·농축 기구' },
      ],
    },
    {
      code: 'protein.amino_acid',
      label: '아미노산·펩타이드',
      children: [
        { code: 'protein.amino_acid.standard', label: '표준 아미노산 (L/D형)' },
        { code: 'protein.amino_acid.protected', label: '보호기 아미노산 (Fmoc/Boc)' },
        { code: 'protein.amino_acid.peptide', label: '합성 펩타이드' },
        { code: 'protein.amino_acid.library', label: '펩타이드 라이브러리' },
      ],
    },
    {
      code: 'protein.expression',
      label: '단백질 발현 시스템',
      children: [
        { code: 'protein.expression.cell_free', label: '시험관 발현 (Cell-free)' },
        { code: 'protein.expression.ecoli', label: '대장균 발현 키트' },
        { code: 'protein.expression.yeast', label: '효모 발현 키트' },
        { code: 'protein.expression.insect', label: '곤충세포 발현 (Baculovirus)' },
        { code: 'protein.expression.mammalian', label: '포유류 발현 벡터' },
      ],
    },
  ],

  supply: [
    { code: 'supply.glassware', label: '유리기구' },
    { code: 'supply.plastic', label: '플라스틱 소모품' },
    { code: 'supply.filter', label: '필터·멤브레인' },
    { code: 'supply.tube', label: '튜브·용기' },
    { code: 'supply.pipette', label: '피펫·팁' },
    { code: 'supply.plate', label: '플레이트·웰플레이트' },
    { code: 'supply.safety', label: '안전용품' },
    { code: 'supply.other', label: '기타 소모품' },
  ],

  equipment: [
    {
      code: 'equipment.centrifuge',
      label: '원심분리기',
      children: [
        { code: 'equipment.centrifuge.micro', label: '마이크로 원심분리기' },
        { code: 'equipment.centrifuge.benchtop', label: '벤치탑 원심분리기' },
        { code: 'equipment.centrifuge.floor', label: '대형 원심분리기' },
        { code: 'equipment.centrifuge.ultra', label: '초고속 원심분리기' },
      ],
    },
    {
      code: 'equipment.pcr',
      label: 'PCR·qPCR 장비',
      children: [
        { code: 'equipment.pcr.conventional', label: '일반 PCR 기기' },
        { code: 'equipment.pcr.qpcr', label: '실시간 PCR (qPCR)' },
        { code: 'equipment.pcr.digital', label: '디지털 PCR (dPCR)' },
      ],
    },
    {
      code: 'equipment.microscope',
      label: '현미경',
      children: [
        { code: 'equipment.microscope.optical', label: '광학 현미경' },
        { code: 'equipment.microscope.inverted', label: '도립 현미경' },
        { code: 'equipment.microscope.fluorescence', label: '형광 현미경' },
        { code: 'equipment.microscope.confocal', label: '공초점 현미경' },
        { code: 'equipment.microscope.electron', label: '전자현미경 (SEM/TEM)' },
      ],
    },
    {
      code: 'equipment.spectro',
      label: '분광·검출 장비',
      children: [
        { code: 'equipment.spectro.uvvis', label: 'UV-Vis 분광광도계' },
        { code: 'equipment.spectro.plate_reader', label: '마이크로플레이트 리더' },
        { code: 'equipment.spectro.nanodrop', label: 'NanoDrop (나노드롭)' },
        { code: 'equipment.spectro.ftir', label: 'FT-IR 분광기' },
        { code: 'equipment.spectro.raman', label: '라만 분광기' },
      ],
    },
    {
      code: 'equipment.cell_culture',
      label: '세포배양 장비',
      children: [
        { code: 'equipment.cell_culture.co2', label: 'CO₂ 인큐베이터' },
        { code: 'equipment.cell_culture.bsc', label: '생물안전캐비닛 (BSC)' },
        { code: 'equipment.cell_culture.shaker', label: '진탕배양기 (Shaker)' },
        { code: 'equipment.cell_culture.bioreactor', label: '바이오리액터' },
      ],
    },
    {
      code: 'equipment.chromatography',
      label: '크로마토그래피',
      children: [
        { code: 'equipment.chromatography.fplc', label: 'FPLC / ÄKTA 시스템' },
        { code: 'equipment.chromatography.hplc', label: 'HPLC 시스템' },
        { code: 'equipment.chromatography.uhplc', label: 'UHPLC 시스템' },
        { code: 'equipment.chromatography.gc', label: 'GC 시스템' },
      ],
    },
    {
      code: 'equipment.cold_storage',
      label: '저온·보관 장비',
      children: [
        { code: 'equipment.cold_storage.fridge', label: '시약용 냉장고' },
        { code: 'equipment.cold_storage.freezer_20', label: '-20°C 냉동고' },
        { code: 'equipment.cold_storage.freezer_80', label: '-80°C 초저온 냉동고' },
        { code: 'equipment.cold_storage.ln2', label: '액체질소 탱크' },
      ],
    },
    {
      code: 'equipment.organoid',
      label: '오가노이드 장비',
      children: [
        { code: 'equipment.organoid.bioprinter', label: '3D 바이오프린터' },
        { code: 'equipment.organoid.bioreactor', label: '오가노이드 바이오리액터' },
        { code: 'equipment.organoid.imaging', label: '라이브 이미징 시스템' },
        { code: 'equipment.organoid.casting', label: '하이드로겔 캐스팅 시스템' },
      ],
    },
    {
      code: 'equipment.animal_experiment',
      label: '동물실험 장비',
      children: [
        { code: 'equipment.animal_experiment.anesthesia', label: '동물 마취기' },
        { code: 'equipment.animal_experiment.stereotaxic', label: '뇌정위 고정장치' },
        { code: 'equipment.animal_experiment.behavioral', label: '행동분석 장치' },
        { code: 'equipment.animal_experiment.imaging', label: '소동물 이미징 (IVIS)' },
        { code: 'equipment.animal_experiment.metabolic', label: '대사 측정 케이지' },
      ],
    },
    {
      code: 'equipment.other',
      label: '기타 분석 장비',
    },
  ],
}

export interface FlatCategory {
  code: string
  label: string
  breadcrumb: string
  type: ItemType
}

function flatten(): FlatCategory[] {
  const result: FlatCategory[] = []
  for (const [type, nodes] of Object.entries(CATEGORY_TREE) as [ItemType, CategoryNode[]][]) {
    const typLabel = ITEM_TYPE_LABELS[type]
    for (const node of nodes) {
      result.push({ code: node.code, label: node.label, breadcrumb: typLabel, type })
      if (node.children) {
        for (const child of node.children) {
          result.push({ code: child.code, label: child.label, breadcrumb: node.label, type })
        }
      }
    }
  }
  return result
}

export const ALL_CATEGORIES: FlatCategory[] = flatten()

export function searchCategories(query: string, limit = 8): FlatCategory[] {
  const q = query.toLowerCase()
  return ALL_CATEGORIES.filter(
    c => c.label.toLowerCase().includes(q) || c.breadcrumb.toLowerCase().includes(q) || c.code.includes(q)
  ).slice(0, limit)
}
