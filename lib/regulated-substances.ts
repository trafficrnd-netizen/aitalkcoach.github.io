/**
 * 국내외 규제 화학물질 목록 (MVP 큐레이션)
 *
 * 출처:
 *  - REACH SVHC Candidate List (ECHA)
 *  - TSCA Priority Substances (US EPA)
 *  - 화관법 유해화학물질 목록 (환경부)
 *  - 화심법 제一종 특정화학물질 (일본 환경성)
 *
 * ⚠️ 이 목록은 주요 물질을 큐레이션한 것으로 공식 법령 목록을 대체하지 않습니다.
 *    취급 전 관할 기관의 최신 고시를 반드시 확인하세요.
 */

export type RegLevel = 'high' | 'medium'
export type RegType = 'REACH' | 'TSCA' | '화관법' | '화심법'

export interface RegulatedSubstance {
  cas: string
  nameKo: string
  nameEn: string
  level: RegLevel
  regs: RegType[]
}

export const REGULATED_SUBSTANCES: RegulatedSubstance[] = [
  // ===== 고위험 (high) — CMR Cat.1 / SVHC / 화관법 유해화학물질 =====

  // 발암성 유기화합물
  { cas: '71-43-2',    nameKo: '벤젠',               nameEn: 'Benzene',                      level: 'high', regs: ['REACH', 'TSCA', '화관법', '화심법'] },
  { cas: '50-00-0',    nameKo: '포름알데히드',          nameEn: 'Formaldehyde',                 level: 'high', regs: ['REACH', 'TSCA', '화관법'] },
  { cas: '75-01-4',    nameKo: '염화비닐',             nameEn: 'Vinyl Chloride',               level: 'high', regs: ['REACH', 'TSCA', '화관법', '화심법'] },
  { cas: '106-99-0',   nameKo: '1,3-부타디엔',         nameEn: '1,3-Butadiene',                level: 'high', regs: ['REACH', 'TSCA', '화관법'] },
  { cas: '79-06-1',    nameKo: '아크릴아미드',          nameEn: 'Acrylamide',                   level: 'high', regs: ['REACH', 'TSCA', '화심법'] },
  { cas: '79-01-6',    nameKo: '트리클로로에틸렌',      nameEn: 'Trichloroethylene',             level: 'high', regs: ['REACH', 'TSCA', '화관법', '화심법'] },
  { cas: '127-18-4',   nameKo: '테트라클로로에틸렌',    nameEn: 'Tetrachloroethylene',           level: 'high', regs: ['REACH', 'TSCA', '화심법'] },
  { cas: '56-23-5',    nameKo: '사염화탄소',            nameEn: 'Carbon Tetrachloride',         level: 'high', regs: ['REACH', 'TSCA', '화관법', '화심법'] },
  { cas: '107-13-1',   nameKo: '아크릴로니트릴',        nameEn: 'Acrylonitrile',                level: 'high', regs: ['REACH', 'TSCA', '화관법', '화심법'] },
  { cas: '75-21-8',    nameKo: '에틸렌옥사이드',        nameEn: 'Ethylene Oxide',               level: 'high', regs: ['REACH', 'TSCA', '화관법', '화심법'] },
  { cas: '75-56-9',    nameKo: '프로필렌옥사이드',      nameEn: 'Propylene Oxide',              level: 'high', regs: ['REACH', 'TSCA', '화심법'] },
  { cas: '302-01-2',   nameKo: '히드라진',             nameEn: 'Hydrazine',                    level: 'high', regs: ['REACH', 'TSCA', '화관법'] },
  { cas: '50-32-8',    nameKo: '벤조[a]피렌',           nameEn: 'Benzo[a]pyrene',               level: 'high', regs: ['REACH', 'TSCA'] },
  { cas: '92-87-5',    nameKo: '벤지딘',               nameEn: 'Benzidine',                    level: 'high', regs: ['REACH', 'TSCA'] },
  { cas: '92-67-1',    nameKo: '4-아미노비페닐',        nameEn: '4-Aminobiphenyl',              level: 'high', regs: ['REACH', 'TSCA'] },
  { cas: '91-59-8',    nameKo: '2-나프틸아민',          nameEn: '2-Naphthylamine',              level: 'high', regs: ['REACH', 'TSCA'] },
  { cas: '95-53-4',    nameKo: 'o-톨루이딘',            nameEn: 'o-Toluidine',                  level: 'high', regs: ['REACH', 'TSCA'] },

  // 급성독성 — 화관법 우선관리물질
  { cas: '74-90-8',    nameKo: '시안화수소',            nameEn: 'Hydrogen Cyanide',             level: 'high', regs: ['화관법'] },
  { cas: '7664-39-3',  nameKo: '불화수소',              nameEn: 'Hydrogen Fluoride',            level: 'high', regs: ['화관법'] },
  { cas: '7782-50-5',  nameKo: '염소 기체',             nameEn: 'Chlorine Gas',                 level: 'high', regs: ['화관법'] },
  { cas: '7726-95-6',  nameKo: '브롬',                 nameEn: 'Bromine',                      level: 'high', regs: ['화관법'] },

  // 중금속 — REACH SVHC + 화관법
  { cas: '7439-97-6',  nameKo: '수은',                 nameEn: 'Mercury',                      level: 'high', regs: ['REACH', 'TSCA', '화관법', '화심법'] },
  { cas: '7440-43-9',  nameKo: '카드뮴',               nameEn: 'Cadmium',                      level: 'high', regs: ['REACH', 'TSCA', '화관법', '화심법'] },
  { cas: '7440-38-2',  nameKo: '비소',                 nameEn: 'Arsenic',                      level: 'high', regs: ['REACH', 'TSCA', '화관법'] },
  { cas: '1327-53-3',  nameKo: '삼산화비소',            nameEn: 'Arsenic Trioxide',             level: 'high', regs: ['REACH', '화관법'] },
  { cas: '1333-82-0',  nameKo: '삼산화크롬 (CrVI)',     nameEn: 'Chromium Trioxide',            level: 'high', regs: ['REACH', '화관법'] },
  { cas: '7778-50-9',  nameKo: '다이크롬산 칼륨',       nameEn: 'Potassium Dichromate',         level: 'high', regs: ['REACH', '화관법'] },
  { cas: '10588-01-9', nameKo: '다이크롬산 나트륨',     nameEn: 'Sodium Dichromate',            level: 'high', regs: ['REACH', '화관법'] },

  // 프탈레이트류 — REACH SVHC (생식독성)
  { cas: '117-81-7',   nameKo: 'DEHP (프탈산에스터)',   nameEn: 'Bis(2-ethylhexyl) phthalate', level: 'high', regs: ['REACH'] },
  { cas: '84-74-2',    nameKo: 'DBP',                  nameEn: 'Dibutyl phthalate',            level: 'high', regs: ['REACH'] },
  { cas: '85-68-7',    nameKo: 'BBP',                  nameEn: 'Benzyl butyl phthalate',       level: 'high', regs: ['REACH'] },
  { cas: '84-61-7',    nameKo: 'DCHP',                 nameEn: 'Dicyclohexyl phthalate',       level: 'high', regs: ['REACH'] },

  // ===== 관리대상 (medium) — 규제 대상이나 관리 하에 취급 가능 =====

  // 할로겐화 용매
  { cas: '67-66-3',    nameKo: '클로로포름',            nameEn: 'Chloroform',                   level: 'medium', regs: ['REACH', 'TSCA', '화심법'] },
  { cas: '75-09-2',    nameKo: '디클로로메탄 (DCM)',     nameEn: 'Dichloromethane',              level: 'medium', regs: ['REACH', 'TSCA'] },
  { cas: '107-06-2',   nameKo: '1,2-디클로로에탄',      nameEn: '1,2-Dichloroethane',           level: 'medium', regs: ['REACH', 'TSCA', '화심법'] },

  // 고리형 에테르
  { cas: '123-91-1',   nameKo: '1,4-다이옥산',          nameEn: '1,4-Dioxane',                 level: 'medium', regs: ['REACH', 'TSCA'] },

  // 일반 유기용매 (규제 대상)
  { cas: '67-56-1',    nameKo: '메탄올',               nameEn: 'Methanol',                     level: 'medium', regs: ['TSCA', '화관법'] },
  { cas: '75-15-0',    nameKo: '이황화탄소',            nameEn: 'Carbon Disulfide',             level: 'medium', regs: ['화관법', '화심법'] },
  { cas: '108-88-3',   nameKo: '톨루엔',               nameEn: 'Toluene',                      level: 'medium', regs: ['TSCA'] },
  { cas: '1330-20-7',  nameKo: '자일렌',               nameEn: 'Xylene',                       level: 'medium', regs: ['TSCA'] },
  { cas: '100-42-5',   nameKo: '스티렌',               nameEn: 'Styrene',                      level: 'medium', regs: ['TSCA'] },
  { cas: '110-54-3',   nameKo: 'n-헥산',              nameEn: 'n-Hexane',                     level: 'medium', regs: ['TSCA', '화심법'] },
  { cas: '108-90-7',   nameKo: '클로로벤젠',            nameEn: 'Chlorobenzene',                level: 'medium', regs: ['TSCA', '화심법'] },
  { cas: '75-07-0',    nameKo: '아세트알데히드',         nameEn: 'Acetaldehyde',                level: 'medium', regs: ['TSCA', '화심법'] },

  // 무기산 (화관법 — 고농도)
  { cas: '7664-93-9',  nameKo: '황산',                 nameEn: 'Sulfuric Acid',                level: 'medium', regs: ['화관법'] },
  { cas: '7697-37-2',  nameKo: '질산',                 nameEn: 'Nitric Acid',                  level: 'medium', regs: ['화관법'] },
  { cas: '7647-01-0',  nameKo: '염산 (염화수소)',        nameEn: 'Hydrochloric Acid',            level: 'medium', regs: ['화관법'] },
  { cas: '7783-06-4',  nameKo: '황화수소',              nameEn: 'Hydrogen Sulfide',             level: 'medium', regs: ['화관법'] },

  // 중금속 — 관리 수준
  { cas: '7440-02-0',  nameKo: '니켈',                 nameEn: 'Nickel',                       level: 'medium', regs: ['REACH', '화관법'] },
  { cas: '7791-20-0',  nameKo: '염화니켈',              nameEn: 'Nickel Chloride',              level: 'medium', regs: ['REACH'] },
  { cas: '7646-79-9',  nameKo: '염화코발트(II)',         nameEn: 'Cobalt Dichloride',            level: 'medium', regs: ['REACH'] },
  { cas: '7439-92-1',  nameKo: '납',                   nameEn: 'Lead',                         level: 'medium', regs: ['REACH', 'TSCA', '화관법'] },
  { cas: '7440-47-3',  nameKo: '크롬 (금속)',           nameEn: 'Chromium (metal)',             level: 'medium', regs: ['화관법'] },
]

// CAS → 규제물질 빠른 조회 맵
const _CAS_MAP = new Map<string, RegulatedSubstance>(
  REGULATED_SUBSTANCES.map(s => [s.cas.replace(/\s+/g, ''), s])
)

/**
 * CAS 번호로 규제물질 정보를 반환합니다.
 * @returns 규제물질이면 RegulatedSubstance, 아니면 null
 */
export function checkRegulated(cas: string | null | undefined): RegulatedSubstance | null {
  if (!cas) return null
  return _CAS_MAP.get(cas.trim().replace(/\s+/g, '')) ?? null
}
