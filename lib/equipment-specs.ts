export type FieldType = 'number' | 'select' | 'text' | 'multiselect'

export interface SpecOption {
  value: string
  label: string
}

export interface SpecField {
  key: string
  label: string
  fieldType: FieldType
  unit?: string
  options?: SpecOption[]
  required?: boolean
}

export type EquipmentSubType =
  | 'centrifuge'
  | 'pcr'
  | 'microscope'
  | 'spectro'
  | 'cell_culture'
  | 'chromatography'
  | 'cold_storage'
  | 'organoid'
  | 'animal_experiment'
  | 'other'

export const EQUIPMENT_SUB_TYPE_LABELS: Record<EquipmentSubType, string> = {
  centrifuge: '원심분리기',
  pcr: 'PCR·qPCR 장비',
  microscope: '현미경',
  spectro: '분광·검출 장비',
  cell_culture: '세포배양 장비',
  chromatography: '크로마토그래피',
  cold_storage: '저온·보관 장비',
  organoid: '오가노이드 장비',
  animal_experiment: '동물실험 장비',
  other: '기타 분석 장비',
}

export const EQUIPMENT_SPEC_FIELDS: Record<EquipmentSubType, SpecField[]> = {
  centrifuge: [
    { key: 'max_rpm', label: '최대 RPM', fieldType: 'number', unit: 'RPM', required: true },
    { key: 'max_rcf', label: '최대 RCF', fieldType: 'number', unit: '× g' },
    {
      key: 'rotor_type', label: '로터 타입', fieldType: 'select',
      options: [
        { value: 'fixed', label: 'Fixed-angle' },
        { value: 'swing', label: 'Swing-out' },
        { value: 'vertical', label: 'Vertical' },
      ],
    },
    { key: 'max_volume', label: '최대 튜브 용량', fieldType: 'number', unit: 'mL' },
    {
      key: 'cooling', label: '냉각 여부', fieldType: 'select',
      options: [
        { value: 'cooled', label: '냉각형' },
        { value: 'standard', label: '비냉각형' },
      ],
    },
    {
      key: 'form_factor', label: '크기 구분', fieldType: 'select',
      options: [
        { value: 'micro', label: 'Micro' },
        { value: 'benchtop', label: 'Benchtop' },
        { value: 'floor', label: 'Floor-standing' },
      ],
    },
  ],

  pcr: [
    {
      key: 'block_format', label: '블록 포맷', fieldType: 'select', required: true,
      options: [
        { value: '96', label: '96-well' },
        { value: '384', label: '384-well' },
        { value: '48', label: '48-well' },
      ],
    },
    { key: 'ramp_rate', label: '승온 속도', fieldType: 'number', unit: '°C/sec' },
    { key: 'temp_accuracy', label: '온도 정확도', fieldType: 'number', unit: '±°C' },
    {
      key: 'is_qpcr', label: 'qPCR 기능', fieldType: 'select', required: true,
      options: [
        { value: 'yes', label: 'qPCR 가능' },
        { value: 'no', label: '일반 PCR' },
      ],
    },
    {
      key: 'channels', label: '형광 채널 수', fieldType: 'select',
      options: [
        { value: '1', label: '1채널' },
        { value: '2', label: '2채널' },
        { value: '4', label: '4채널' },
        { value: '6', label: '6채널 이상' },
      ],
    },
    {
      key: 'gradient', label: '그라디언트 기능', fieldType: 'select',
      options: [
        { value: 'yes', label: '있음' },
        { value: 'no', label: '없음' },
      ],
    },
  ],

  microscope: [
    {
      key: 'scope_type', label: '현미경 종류', fieldType: 'select', required: true,
      options: [
        { value: 'optical', label: '광학' },
        { value: 'inverted', label: '도립 (Inverted)' },
        { value: 'fluorescence', label: '형광' },
        { value: 'confocal', label: '공초점 (Confocal)' },
        { value: 'electron', label: '전자 (SEM/TEM)' },
      ],
    },
    { key: 'max_magnification', label: '최대 배율', fieldType: 'number', unit: '×' },
    { key: 'objective_config', label: '대물렌즈 구성', fieldType: 'text' },
    {
      key: 'fluorescence_channels', label: '형광 채널', fieldType: 'multiselect',
      options: [
        { value: 'dapi', label: 'DAPI' },
        { value: 'fitc', label: 'FITC (GFP)' },
        { value: 'tritc', label: 'TRITC (RFP)' },
        { value: 'cy5', label: 'Cy5' },
        { value: 'other', label: '기타' },
      ],
    },
    {
      key: 'camera', label: '카메라 포함', fieldType: 'select',
      options: [
        { value: 'included', label: '포함' },
        { value: 'excluded', label: '미포함' },
      ],
    },
    {
      key: 'stage', label: '스테이지', fieldType: 'select',
      options: [
        { value: 'manual', label: '수동' },
        { value: 'motorized', label: '전동 (Motorized)' },
      ],
    },
  ],

  spectro: [
    {
      key: 'device_type', label: '기기 유형', fieldType: 'select', required: true,
      options: [
        { value: 'uvvis', label: 'UV-Vis 분광광도계' },
        { value: 'plate_reader', label: '마이크로플레이트 리더' },
        { value: 'nanodrop', label: 'NanoDrop (직접측정)' },
        { value: 'ftir', label: 'FT-IR' },
        { value: 'raman', label: '라만 분광기' },
      ],
    },
    { key: 'wavelength_min', label: '파장 범위 (최소)', fieldType: 'number', unit: 'nm' },
    { key: 'wavelength_max', label: '파장 범위 (최대)', fieldType: 'number', unit: 'nm' },
    {
      key: 'detection_mode', label: '검출 모드', fieldType: 'multiselect',
      options: [
        { value: 'absorbance', label: '흡광도' },
        { value: 'fluorescence', label: '형광' },
        { value: 'luminescence', label: '발광' },
        { value: 'trf', label: '시간분해형광' },
      ],
    },
    {
      key: 'plate_format', label: '플레이트 포맷', fieldType: 'select',
      options: [
        { value: '6', label: '6-well' },
        { value: '24', label: '24-well' },
        { value: '48', label: '48-well' },
        { value: '96', label: '96-well' },
        { value: '384', label: '384-well' },
      ],
    },
  ],

  cell_culture: [
    {
      key: 'device_type', label: '기기 유형', fieldType: 'select', required: true,
      options: [
        { value: 'co2_incubator', label: 'CO₂ 인큐베이터' },
        { value: 'bsc', label: '생물안전캐비닛 (BSC)' },
        { value: 'shaker', label: '진탕배양기' },
        { value: 'bioreactor', label: '바이오리액터' },
      ],
    },
    {
      key: 'bsc_class', label: 'BSC 등급', fieldType: 'select',
      options: [
        { value: 'class1', label: 'Class I' },
        { value: 'class2a2', label: 'Class II-A2' },
        { value: 'class2b2', label: 'Class II-B2' },
        { value: 'class3', label: 'Class III' },
      ],
    },
    { key: 'co2_range', label: 'CO₂ 제어 범위', fieldType: 'number', unit: '%' },
    {
      key: 'o2_control', label: 'O₂ 제어', fieldType: 'select',
      options: [
        { value: 'yes', label: '있음' },
        { value: 'no', label: '없음' },
      ],
    },
    { key: 'chamber_volume', label: '챔버 용량', fieldType: 'number', unit: 'L' },
    {
      key: 'humidity', label: '습도 제어', fieldType: 'select',
      options: [
        { value: 'yes', label: '있음' },
        { value: 'no', label: '없음' },
      ],
    },
  ],

  chromatography: [
    {
      key: 'system_type', label: '시스템 유형', fieldType: 'select', required: true,
      options: [
        { value: 'fplc', label: 'FPLC / ÄKTA' },
        { value: 'hplc', label: 'HPLC' },
        { value: 'uhplc', label: 'UHPLC' },
        { value: 'gc', label: 'GC' },
      ],
    },
    { key: 'flow_rate_min', label: '유량 범위 (최소)', fieldType: 'number', unit: 'mL/min' },
    { key: 'flow_rate_max', label: '유량 범위 (최대)', fieldType: 'number', unit: 'mL/min' },
    { key: 'max_pressure', label: '최대 압력', fieldType: 'number', unit: 'MPa' },
    {
      key: 'detector', label: '검출기 유형', fieldType: 'multiselect',
      options: [
        { value: 'uv', label: 'UV' },
        { value: 'dad', label: 'DAD/PDA' },
        { value: 'rid', label: 'RID' },
        { value: 'fld', label: 'FLD' },
        { value: 'ms', label: 'MS' },
      ],
    },
    {
      key: 'automation', label: '자동화 수준', fieldType: 'select',
      options: [
        { value: 'manual', label: '수동' },
        { value: 'semi', label: '반자동' },
        { value: 'auto', label: '완전자동' },
      ],
    },
  ],

  cold_storage: [
    {
      key: 'storage_type', label: '보관 장비 유형', fieldType: 'select', required: true,
      options: [
        { value: 'fridge', label: '시약용 냉장고 (4°C)' },
        { value: 'freezer_20', label: '-20°C 냉동고' },
        { value: 'freezer_80', label: '-80°C 초저온 냉동고' },
        { value: 'ln2', label: '액체질소 탱크' },
        { value: 'dry_ice', label: '드라이아이스 보관' },
      ],
    },
    { key: 'capacity', label: '용량', fieldType: 'number', unit: 'L' },
    {
      key: 'refrigerant', label: '냉매 유형', fieldType: 'select',
      options: [
        { value: 'hfc', label: 'HFC' },
        { value: 'cfc_free', label: 'CFC-free' },
        { value: 'cascade', label: 'Cascade' },
      ],
    },
    {
      key: 'alarm', label: '온도 알람', fieldType: 'select',
      options: [
        { value: 'yes', label: '있음' },
        { value: 'no', label: '없음' },
      ],
    },
  ],

  organoid: [
    {
      key: 'device_type', label: '기기 유형', fieldType: 'select', required: true,
      options: [
        { value: 'bioprinter', label: '3D 바이오프린터' },
        { value: 'bioreactor', label: '오가노이드 바이오리액터' },
        { value: 'incubation', label: '오가노이드 배양 시스템' },
        { value: 'live_imaging', label: '라이브 이미징 시스템' },
        { value: 'casting', label: '하이드로겔 캐스팅 시스템' },
        { value: 'hts', label: '고처리량 오가노이드 플랫폼 (HTS)' },
      ],
    },
    {
      key: 'organoid_type', label: '대상 오가노이드', fieldType: 'multiselect',
      options: [
        { value: 'intestinal', label: '장 오가노이드' },
        { value: 'brain', label: '뇌 오가노이드 (세레브로이드)' },
        { value: 'liver', label: '간 오가노이드' },
        { value: 'lung', label: '폐 오가노이드' },
        { value: 'kidney', label: '신장 오가노이드' },
        { value: 'tumor', label: '종양 오가노이드 (PDO)' },
        { value: 'other', label: '기타' },
      ],
    },
    { key: 'throughput', label: '처리량', fieldType: 'number', unit: 'well/run' },
    {
      key: 'co2_control', label: 'CO₂ 제어', fieldType: 'select',
      options: [
        { value: 'yes', label: '있음' },
        { value: 'no', label: '없음' },
      ],
    },
    {
      key: 'imaging', label: '이미징 통합', fieldType: 'select',
      options: [
        { value: 'brightfield', label: 'Brightfield' },
        { value: 'fluorescence', label: 'Fluorescence' },
        { value: 'confocal', label: 'Confocal' },
        { value: 'none', label: '없음' },
      ],
    },
  ],

  animal_experiment: [
    {
      key: 'device_type', label: '기기 유형', fieldType: 'select', required: true,
      options: [
        { value: 'anesthesia', label: '동물 마취기 (흡입 마취)' },
        { value: 'stereotaxic', label: '뇌정위 고정장치 (Stereotaxic Frame)' },
        { value: 'metabolic_cage', label: '대사 측정 케이지 (Metabolic Cage)' },
        { value: 'behavioral', label: '행동분석 장치 (Open Field/Water Maze)' },
        { value: 'ivis', label: '소동물 생체 이미징 (IVIS/IVIS Spectrum)' },
        { value: 'blood_analyzer', label: '혈액분석기 (동물용)' },
        { value: 'incubator', label: '동물용 보온 인큐베이터' },
        { value: 'restrainer', label: '고정장치 (Restrainer)' },
        { value: 'irradiator', label: '소동물 방사선 조사기' },
      ],
    },
    {
      key: 'animal_type', label: '적용 동물', fieldType: 'multiselect',
      options: [
        { value: 'mouse', label: '마우스 (Mouse)' },
        { value: 'rat', label: '랫드 (Rat)' },
        { value: 'rabbit', label: '토끼 (Rabbit)' },
        { value: 'zebrafish', label: '제브라피쉬 (Zebrafish)' },
        { value: 'pig', label: '돼지 / 미니돼지 (Pig/Minipig)' },
        { value: 'other', label: '기타' },
      ],
    },
    {
      key: 'anesthesia_gas', label: '마취 가스', fieldType: 'select',
      options: [
        { value: 'isoflurane', label: '이소플루란 (Isoflurane)' },
        { value: 'sevoflurane', label: '세보플루란 (Sevoflurane)' },
        { value: 'co2', label: 'CO₂' },
        { value: 'na', label: '해당 없음' },
      ],
    },
    { key: 'capacity', label: '수용 마릿수', fieldType: 'number', unit: '마리' },
    {
      key: 'imaging_mode', label: '이미징 모드', fieldType: 'multiselect',
      options: [
        { value: 'bioluminescence', label: '생물발광 (BLI)' },
        { value: 'fluorescence', label: '형광 (FLI)' },
        { value: 'ct', label: 'CT' },
        { value: 'xray', label: 'X-ray' },
        { value: 'na', label: '해당 없음' },
      ],
    },
  ],

  other: [
    { key: 'device_name', label: '장비명', fieldType: 'text', required: true },
    { key: 'spec1_key', label: '주요 스펙 1 — 항목명', fieldType: 'text' },
    { key: 'spec1_val', label: '주요 스펙 1 — 값', fieldType: 'text' },
    { key: 'spec2_key', label: '주요 스펙 2 — 항목명', fieldType: 'text' },
    { key: 'spec2_val', label: '주요 스펙 2 — 값', fieldType: 'text' },
    { key: 'spec3_key', label: '주요 스펙 3 — 항목명', fieldType: 'text' },
    { key: 'spec3_val', label: '주요 스펙 3 — 값', fieldType: 'text' },
    { key: 'purpose', label: '용도', fieldType: 'text' },
  ],
}
