export type ItemType = 'reagent' | 'protein' | 'supply' | 'equipment'

export interface CategoryNode {
  code: string
  label: string       // Korean
  labelEn?: string    // English
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

/** Return the localised label for a category node */
export function getCatLabel(node: { label: string; labelEn?: string }, lang: string): string {
  return lang === 'en' && node.labelEn ? node.labelEn : node.label
}

export const CATEGORY_TREE: Record<ItemType, CategoryNode[]> = {
  reagent: [
    { code: 'reagent.general',      label: '일반화학시약',    labelEn: 'General Chemical Reagents' },
    { code: 'reagent.analytical',   label: '분석용시약',      labelEn: 'Analytical Reagents' },
    { code: 'reagent.biochem',      label: '생화학시약',      labelEn: 'Biochemical Reagents' },
    { code: 'reagent.cell_culture', label: '세포배양용시약',  labelEn: 'Cell Culture Reagents' },
    { code: 'reagent.solvent',      label: '유기용매',        labelEn: 'Organic Solvents' },
    { code: 'reagent.buffer',       label: '버퍼·염',         labelEn: 'Buffers & Salts' },
    { code: 'reagent.safety',       label: '안전용품·시약',   labelEn: 'Safety Reagents' },
    { code: 'reagent.other',        label: '기타 시약',       labelEn: 'Other Reagents' },
  ],

  protein: [
    {
      code: 'protein.recombinant', label: '재조합 단백질', labelEn: 'Recombinant Proteins',
      children: [
        { code: 'protein.recombinant.cytokine',   label: '사이토카인·인터루킨',            labelEn: 'Cytokines & Interleukins' },
        { code: 'protein.recombinant.gf',         label: '성장인자 (EGF/FGF/VEGF)',        labelEn: 'Growth Factors (EGF/FGF/VEGF)' },
        { code: 'protein.recombinant.receptor',   label: '수용체·리간드',                  labelEn: 'Receptors & Ligands' },
        { code: 'protein.recombinant.enzyme',     label: '효소 (중합효소/프로테아제)',      labelEn: 'Enzymes (Polymerase/Protease)' },
        { code: 'protein.recombinant.tf',         label: '전사인자',                       labelEn: 'Transcription Factors' },
        { code: 'protein.recombinant.structural', label: '구조 단백질 (Actin/Tubulin)',    labelEn: 'Structural Proteins (Actin/Tubulin)' },
      ],
    },
    {
      code: 'protein.antibody', label: '항체', labelEn: 'Antibodies',
      children: [
        { code: 'protein.antibody.primary_mab', label: '1차 항체 (단클론)', labelEn: 'Primary Antibodies (Monoclonal)' },
        { code: 'protein.antibody.primary_pab', label: '1차 항체 (다클론)', labelEn: 'Primary Antibodies (Polyclonal)' },
        { code: 'protein.antibody.secondary',   label: '2차 항체',          labelEn: 'Secondary Antibodies' },
        { code: 'protein.antibody.fluorescent', label: '형광표지 항체',      labelEn: 'Fluorescent-labeled Antibodies' },
        { code: 'protein.antibody.hrp',         label: 'HRP·AP 표지 항체', labelEn: 'HRP/AP-conjugated Antibodies' },
        { code: 'protein.antibody.recombinant', label: '재조합 항체',        labelEn: 'Recombinant Antibodies' },
      ],
    },
    {
      code: 'protein.analysis', label: '단백질 분석 키트', labelEn: 'Protein Analysis Kits',
      children: [
        { code: 'protein.analysis.quantification', label: '단백질 정량 (BCA/Bradford)', labelEn: 'Protein Quantification (BCA/Bradford)' },
        { code: 'protein.analysis.elisa',          label: 'ELISA 키트',                 labelEn: 'ELISA Kits' },
        { code: 'protein.analysis.wb',             label: '웨스턴블롯 시약',             labelEn: 'Western Blot Reagents' },
        { code: 'protein.analysis.ip',             label: 'IP / Co-IP 키트',            labelEn: 'IP / Co-IP Kits' },
        { code: 'protein.analysis.ms',             label: '질량분석 시약',               labelEn: 'Mass Spectrometry Reagents' },
      ],
    },
    {
      code: 'protein.electrophoresis', label: '전기영동 시약', labelEn: 'Electrophoresis Reagents',
      children: [
        { code: 'protein.electrophoresis.gel',    label: 'PAGE 겔·버퍼',                      labelEn: 'PAGE Gel & Buffers' },
        { code: 'protein.electrophoresis.marker', label: '분자량 마커·래더',                   labelEn: 'MW Markers & Ladders' },
        { code: 'protein.electrophoresis.stain',  label: '겔 염색 시약 (Coomassie/Silver)',    labelEn: 'Gel Staining (Coomassie/Silver)' },
      ],
    },
    {
      code: 'protein.purification', label: '단백질 정제 시약', labelEn: 'Protein Purification Reagents',
      children: [
        { code: 'protein.purification.affinity',     label: '친화성 정제 (His/GST/FLAG)', labelEn: 'Affinity Purification (His/GST/FLAG)' },
        { code: 'protein.purification.ion_exchange', label: '이온교환 수지',               labelEn: 'Ion Exchange Resin' },
        { code: 'protein.purification.sec',          label: '겔여과 수지',                 labelEn: 'Size Exclusion Resin' },
        { code: 'protein.purification.hic',          label: '소수성 수지',                 labelEn: 'Hydrophobic Resin' },
        { code: 'protein.purification.dialysis',     label: '투석·농축 기구',              labelEn: 'Dialysis & Concentrators' },
      ],
    },
    {
      code: 'protein.amino_acid', label: '아미노산·펩타이드', labelEn: 'Amino Acids & Peptides',
      children: [
        { code: 'protein.amino_acid.standard',  label: '표준 아미노산 (L/D형)',          labelEn: 'Standard Amino Acids (L/D form)' },
        { code: 'protein.amino_acid.protected', label: '보호기 아미노산 (Fmoc/Boc)',     labelEn: 'Protected Amino Acids (Fmoc/Boc)' },
        { code: 'protein.amino_acid.peptide',   label: '합성 펩타이드',                  labelEn: 'Synthetic Peptides' },
        { code: 'protein.amino_acid.library',   label: '펩타이드 라이브러리',            labelEn: 'Peptide Libraries' },
      ],
    },
    {
      code: 'protein.expression', label: '단백질 발현 시스템', labelEn: 'Protein Expression Systems',
      children: [
        { code: 'protein.expression.cell_free',  label: '시험관 발현 (Cell-free)',           labelEn: 'Cell-free Expression' },
        { code: 'protein.expression.ecoli',      label: '대장균 발현 키트',                  labelEn: 'E. coli Expression Kits' },
        { code: 'protein.expression.yeast',      label: '효모 발현 키트',                    labelEn: 'Yeast Expression Kits' },
        { code: 'protein.expression.insect',     label: '곤충세포 발현 (Baculovirus)',        labelEn: 'Insect Cell Expression (Baculovirus)' },
        { code: 'protein.expression.mammalian',  label: '포유류 발현 벡터',                  labelEn: 'Mammalian Expression Vectors' },
      ],
    },
  ],

  supply: [
    { code: 'supply.glassware', label: '유리기구',         labelEn: 'Glassware' },
    { code: 'supply.plastic',   label: '플라스틱 소모품',  labelEn: 'Plastic Consumables' },
    { code: 'supply.filter',    label: '필터·멤브레인',    labelEn: 'Filters & Membranes' },
    { code: 'supply.tube',      label: '튜브·용기',        labelEn: 'Tubes & Containers' },
    { code: 'supply.pipette',   label: '피펫·팁',          labelEn: 'Pipettes & Tips' },
    { code: 'supply.plate',     label: '플레이트·웰플레이트', labelEn: 'Plates & Well Plates' },
    { code: 'supply.safety',    label: '안전용품',         labelEn: 'Safety Supplies' },
    { code: 'supply.other',     label: '기타 소모품',      labelEn: 'Other Consumables' },
  ],

  equipment: [
    {
      code: 'equipment.centrifuge', label: '원심분리기', labelEn: 'Centrifuges',
      children: [
        { code: 'equipment.centrifuge.micro',    label: '마이크로 원심분리기', labelEn: 'Microcentrifuge' },
        { code: 'equipment.centrifuge.benchtop', label: '벤치탑 원심분리기',  labelEn: 'Benchtop Centrifuge' },
        { code: 'equipment.centrifuge.floor',    label: '대형 원심분리기',     labelEn: 'Floor Centrifuge' },
        { code: 'equipment.centrifuge.ultra',    label: '초고속 원심분리기',   labelEn: 'Ultracentrifuge' },
      ],
    },
    {
      code: 'equipment.pcr', label: 'PCR·qPCR 장비', labelEn: 'PCR & qPCR Instruments',
      children: [
        { code: 'equipment.pcr.conventional', label: '일반 PCR 기기',       labelEn: 'Conventional PCR' },
        { code: 'equipment.pcr.qpcr',         label: '실시간 PCR (qPCR)',   labelEn: 'Real-time PCR (qPCR)' },
        { code: 'equipment.pcr.digital',      label: '디지털 PCR (dPCR)',   labelEn: 'Digital PCR (dPCR)' },
      ],
    },
    {
      code: 'equipment.microscope', label: '현미경', labelEn: 'Microscopes',
      children: [
        { code: 'equipment.microscope.optical',      label: '광학 현미경',            labelEn: 'Optical Microscope' },
        { code: 'equipment.microscope.inverted',     label: '도립 현미경',            labelEn: 'Inverted Microscope' },
        { code: 'equipment.microscope.fluorescence', label: '형광 현미경',            labelEn: 'Fluorescence Microscope' },
        { code: 'equipment.microscope.confocal',     label: '공초점 현미경',          labelEn: 'Confocal Microscope' },
        { code: 'equipment.microscope.electron',     label: '전자현미경 (SEM/TEM)',   labelEn: 'Electron Microscope (SEM/TEM)' },
      ],
    },
    {
      code: 'equipment.spectro', label: '분광·검출 장비', labelEn: 'Spectroscopy & Detection',
      children: [
        { code: 'equipment.spectro.uvvis',        label: 'UV-Vis 분광광도계',      labelEn: 'UV-Vis Spectrophotometer' },
        { code: 'equipment.spectro.plate_reader', label: '마이크로플레이트 리더',  labelEn: 'Microplate Reader' },
        { code: 'equipment.spectro.nanodrop',     label: 'NanoDrop (나노드롭)',    labelEn: 'NanoDrop' },
        { code: 'equipment.spectro.ftir',         label: 'FT-IR 분광기',           labelEn: 'FT-IR Spectrometer' },
        { code: 'equipment.spectro.raman',        label: '라만 분광기',            labelEn: 'Raman Spectrometer' },
      ],
    },
    {
      code: 'equipment.cell_culture', label: '세포배양 장비', labelEn: 'Cell Culture Equipment',
      children: [
        { code: 'equipment.cell_culture.co2',        label: 'CO₂ 인큐베이터',         labelEn: 'CO₂ Incubator' },
        { code: 'equipment.cell_culture.bsc',        label: '생물안전캐비닛 (BSC)',   labelEn: 'Biosafety Cabinet (BSC)' },
        { code: 'equipment.cell_culture.shaker',     label: '진탕배양기 (Shaker)',    labelEn: 'Shaker Incubator' },
        { code: 'equipment.cell_culture.bioreactor', label: '바이오리액터',           labelEn: 'Bioreactor' },
      ],
    },
    {
      code: 'equipment.chromatography', label: '크로마토그래피', labelEn: 'Chromatography Systems',
      children: [
        { code: 'equipment.chromatography.fplc',  label: 'FPLC / ÄKTA 시스템', labelEn: 'FPLC / ÄKTA System' },
        { code: 'equipment.chromatography.hplc',  label: 'HPLC 시스템',         labelEn: 'HPLC System' },
        { code: 'equipment.chromatography.uhplc', label: 'UHPLC 시스템',        labelEn: 'UHPLC System' },
        { code: 'equipment.chromatography.gc',    label: 'GC 시스템',           labelEn: 'GC System' },
      ],
    },
    {
      code: 'equipment.cold_storage', label: '저온·보관 장비', labelEn: 'Cold Storage Equipment',
      children: [
        { code: 'equipment.cold_storage.fridge',     label: '시약용 냉장고',        labelEn: 'Lab Refrigerator' },
        { code: 'equipment.cold_storage.freezer_20', label: '-20°C 냉동고',         labelEn: '-20°C Freezer' },
        { code: 'equipment.cold_storage.freezer_80', label: '-80°C 초저온 냉동고', labelEn: '-80°C ULT Freezer' },
        { code: 'equipment.cold_storage.ln2',        label: '액체질소 탱크',        labelEn: 'Liquid Nitrogen Tank' },
      ],
    },
    {
      code: 'equipment.organoid', label: '오가노이드 장비', labelEn: 'Organoid Equipment',
      children: [
        { code: 'equipment.organoid.bioprinter',  label: '3D 바이오프린터',          labelEn: '3D Bioprinter' },
        { code: 'equipment.organoid.bioreactor',  label: '오가노이드 바이오리액터',  labelEn: 'Organoid Bioreactor' },
        { code: 'equipment.organoid.imaging',     label: '라이브 이미징 시스템',    labelEn: 'Live Imaging System' },
        { code: 'equipment.organoid.casting',     label: '하이드로겔 캐스팅 시스템', labelEn: 'Hydrogel Casting System' },
      ],
    },
    {
      code: 'equipment.animal_experiment', label: '동물실험 장비', labelEn: 'Animal Research Equipment',
      children: [
        { code: 'equipment.animal_experiment.anesthesia',   label: '동물 마취기',            labelEn: 'Animal Anesthesia Machine' },
        { code: 'equipment.animal_experiment.stereotaxic',  label: '뇌정위 고정장치',        labelEn: 'Stereotaxic Frame' },
        { code: 'equipment.animal_experiment.behavioral',   label: '행동분석 장치',          labelEn: 'Behavioral Analysis System' },
        { code: 'equipment.animal_experiment.imaging',      label: '소동물 이미징 (IVIS)',   labelEn: 'Small Animal Imaging (IVIS)' },
        { code: 'equipment.animal_experiment.metabolic',    label: '대사 측정 케이지',       labelEn: 'Metabolic Cage' },
      ],
    },
    {
      code: 'equipment.pretreatment', label: '전처리장비', labelEn: 'Sample Preparation Equipment',
      children: [
        { code: 'equipment.pretreatment.homogenize',   label: '분쇄·균질화 장비 (Homogenizer/Mill)',              labelEn: 'Homogenizer / Mill' },
        { code: 'equipment.pretreatment.extraction',   label: '추출·정제 장비 (SPE/LLE/ASE)',                    labelEn: 'Extraction Equipment (SPE/LLE/ASE)' },
        { code: 'equipment.pretreatment.digestion',    label: '소화·분해 장비 (Microwave/Hot Block Digester)',   labelEn: 'Digestion Equipment (Microwave/Hot Block)' },
        { code: 'equipment.pretreatment.concentration',label: '농축·증발 장비 (N2 Evaporator/Rotary Evaporator)', labelEn: 'Concentrators (N₂ Evaporator/Rotovap)' },
        { code: 'equipment.pretreatment.filtration',   label: '여과·정제 보조 장비 (Vacuum Filtration/UF)',      labelEn: 'Filtration Equipment (Vacuum/UF)' },
        { code: 'equipment.pretreatment.automation',   label: '보조·자동화 장비 (Shaker/Vortex/Liquid Handler)', labelEn: 'Automation (Shaker/Vortex/Liquid Handler)' },
      ],
    },
    {
      code: 'equipment.chem_synthesis', label: '화학합성 장비', labelEn: 'Chemical Synthesis Equipment',
      children: [
        { code: 'equipment.chem_synthesis.reactor',  label: '반응기·합성기 (Flask/Reactor)',               labelEn: 'Reactor / Synthesizer' },
        { code: 'equipment.chem_synthesis.stirrer',  label: '교반·혼합 장비 (Stirrer/Mixer)',              labelEn: 'Stirrer / Mixer' },
        { code: 'equipment.chem_synthesis.heating',  label: '가열·냉각 시스템 (Oil bath/Dry bath/Chiller)', labelEn: 'Heating & Cooling Systems' },
        { code: 'equipment.chem_synthesis.vacuum',   label: '진공·압력 장비 (Vacuum pump/Manifold)',       labelEn: 'Vacuum & Pressure Equipment' },
        { code: 'equipment.chem_synthesis.rotovap',  label: '회전증발기·농축기 (Rotovap/Concentrator)',    labelEn: 'Rotary Evaporator / Concentrator' },
        { code: 'equipment.chem_synthesis.parallel', label: '병렬·자동 합성 장비 (Parallel Synthesizer)',  labelEn: 'Parallel / Automated Synthesizer' },
      ],
    },
    {
      code: 'equipment.inorganic', label: '무기화학 관련장비', labelEn: 'Inorganic Chemistry Equipment',
      children: [
        { code: 'equipment.inorganic.furnace',          label: '고온 소결·소성로 (Tube/Box Furnace)',           labelEn: 'High-temp Furnace (Tube/Box)' },
        { code: 'equipment.inorganic.deposition',       label: '박막·증착 장비 (PVD/CVD/ALD)',                 labelEn: 'Thin Film Deposition (PVD/CVD/ALD)' },
        { code: 'equipment.inorganic.hydrothermal',     label: '수열·용매열합성 장비 (Autoclave)',              labelEn: 'Hydrothermal Synthesis (Autoclave)' },
        { code: 'equipment.inorganic.powder',           label: '분말 처리·밀링 장비 (Ball Mill/Planetary Mill)', labelEn: 'Powder Milling Equipment' },
        { code: 'equipment.inorganic.plasma',           label: '플라즈마·아크방전 장비 (Plasma Reactor/Arc Furnace)', labelEn: 'Plasma & Arc Equipment' },
        { code: 'equipment.inorganic.surface_analysis', label: '표면 분석 장비 (XPS/AES/SIMS)',                labelEn: 'Surface Analysis (XPS/AES/SIMS)' },
      ],
    },
    { code: 'equipment.other', label: '기타 분석 장비', labelEn: 'Other Analytical Equipment' },
  ],
}

export interface FlatCategory {
  code: string
  label: string
  labelEn?: string
  breadcrumb: string
  breadcrumbEn?: string
  type: ItemType
}

function flatten(): FlatCategory[] {
  const result: FlatCategory[] = []
  for (const [type, nodes] of Object.entries(CATEGORY_TREE) as [ItemType, CategoryNode[]][]) {
    const typLabel = ITEM_TYPE_LABELS[type]
    for (const node of nodes) {
      result.push({ code: node.code, label: node.label, labelEn: node.labelEn, breadcrumb: typLabel, type })
      if (node.children) {
        for (const child of node.children) {
          result.push({ code: child.code, label: child.label, labelEn: child.labelEn, breadcrumb: node.label, breadcrumbEn: node.labelEn, type })
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
    c =>
      c.label.toLowerCase().includes(q) ||
      (c.labelEn ?? '').toLowerCase().includes(q) ||
      c.breadcrumb.toLowerCase().includes(q) ||
      c.code.includes(q)
  ).slice(0, limit)
}
