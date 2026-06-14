/**
 * 국가별 화학물질 규제 및 인증 요구사항
 *
 * onlineVerify 항목 범례:
 *   'full'    — 공식 API 또는 공개 DB로 실시간/자동 조회 가능
 *   'partial' — 담당기관 웹사이트에서 수동 검색 가능 (API 없음)
 *   'none'    — 온라인 조회 불가 (서면/방문 확인만 가능)
 */

export type CountryCode = 'KR' | 'US' | 'EU' | 'JP' | 'CN' | 'OTHER'
export type VerifyLevel = 'full' | 'partial' | 'none'
export type SupplyTypeFilter = 'chemical' | 'equipment' | 'both'

export interface CountryRegulation {
  id: string                    // 고유 ID (DB 저장용)
  nameKo: string
  nameEn: string
  nativeTerm?: string           // 원문 언어 병기 (중문·일문·영문 약칭 등)
  authority: string             // 담당기관명
  authorityUrl?: string         // 담당기관 URL
  description: string           // 규제 내용 설명 (한국어)
  appliesToType: SupplyTypeFilter
  requiredAck: boolean          // 가입 시 필수 동의 여부
  permitNumberLabel?: string    // 허가번호 입력 레이블 (있으면 텍스트 입력 표시)
  permitNumberPh?: string       // 허가번호 placeholder
  uploadLabel?: string          // 서류 업로드 레이블 (있으면 파일 입력 표시)
  onlineVerify: {
    level: VerifyLevel
    url?: string                // 조회 사이트 URL
    note: string                // 조회 방법 설명
  }
}

export interface CountryConfig {
  code: CountryCode
  nameKo: string
  nameEn: string
  flag: string
  regulations: CountryRegulation[]
}

export const COUNTRY_REGULATIONS: CountryConfig[] = [
  // ───────────────────────── 대한민국 ─────────────────────────
  {
    code: 'KR',
    nameKo: '대한민국',
    nameEn: 'South Korea',
    flag: '🇰🇷',
    regulations: [
      {
        id: 'KR_HWAGWAN',
        nameKo: '화관법 유해화학물질 취급업 등록',
        nameEn: 'Chemicals Control Act – Hazardous Chemical Business Registration',
        authority: '환경부 / 화학물질안전원',
        authorityUrl: 'https://chims.me.go.kr',
        description:
          '유해화학물질을 취급·판매하는 사업자는 화학물질관리법(화관법)에 따라 취급업 등록 또는 영업허가를 받아야 합니다. ' +
          '미등록 취급 시 3년 이하 징역 또는 5,000만 원 이하 벌금이 부과됩니다.',
        appliesToType: 'chemical',
        requiredAck: true,
        permitNumberLabel: '화관법 취급업 등록번호',
        permitNumberPh: '예) 허가-20XX-XXXXX',
        uploadLabel: '취급업 등록증 또는 영업허가증 (PDF/이미지)',
        onlineVerify: {
          level: 'partial',
          url: 'https://chims.me.go.kr',
          note: '환경부 화학물질정보시스템(CHIMS)에서 사업장 등록 여부를 수동 검색할 수 있으나, 자동 API는 제공되지 않습니다.',
        },
      },
      {
        id: 'KR_HWAPYEONG',
        nameKo: '화평법 신규 화학물질 등록',
        nameEn: 'K-REACH – New Chemical Substance Registration',
        authority: '환경부 / 국립환경과학원',
        authorityUrl: 'https://ncis.nier.go.kr',
        description:
          '연간 1톤 이상 제조·수입하는 신규 화학물질은 화학물질의 등록 및 평가에 관한 법률(화평법)에 따라 사전 등록이 필요합니다. ' +
          '기존 화학물질도 연간 1톤 이상이면 등록 의무가 있습니다.',
        appliesToType: 'chemical',
        requiredAck: true,
        permitNumberLabel: 'K-REACH 등록번호 (해당 시)',
        permitNumberPh: '예) KR-XXXX-XXXXX',
        uploadLabel: '화학물질 등록필증 (PDF)',
        onlineVerify: {
          level: 'partial',
          url: 'https://ncis.nier.go.kr',
          note: '국립환경과학원 화학물질정보시스템(NCIS)에서 등록 목록을 조회할 수 있으나, 실시간 API는 미제공입니다.',
        },
      },
      {
        id: 'KR_SDS',
        nameKo: '산업안전보건법 SDS 제출 의무',
        nameEn: 'Occupational Safety and Health Act – SDS Submission',
        authority: '고용노동부',
        authorityUrl: 'https://msds.kosha.or.kr',
        description:
          '화학물질을 양도·제공하는 경우 GHS 기준에 따른 물질안전보건자료(SDS)를 제공해야 합니다. ' +
          '안전보건공단 MSDS 시스템에 등록된 SDS를 활용할 수 있습니다.',
        appliesToType: 'chemical',
        requiredAck: true,
        uploadLabel: 'SDS 샘플 (PDF)',
        onlineVerify: {
          level: 'full',
          url: 'https://msds.kosha.or.kr',
          note: '안전보건공단 MSDS 검색 시스템에서 물질명/CAS 번호로 등록된 SDS를 자유롭게 조회할 수 있습니다.',
        },
      },
      {
        id: 'KR_KC',
        nameKo: 'KC 인증 (전기·전자 장비)',
        nameEn: 'KC Certification (Electrical/Electronic Equipment)',
        authority: '국가기술표준원',
        authorityUrl: 'https://kcmark.kr',
        description:
          '국내 판매·유통되는 전기·전자 장비는 안전확인 또는 자기적합선언을 통해 KC 인증을 취득해야 합니다.',
        appliesToType: 'equipment',
        requiredAck: true,
        permitNumberLabel: 'KC 인증번호',
        permitNumberPh: '예) KC YYZZ-XXXXX',
        uploadLabel: 'KC 인증서 (PDF)',
        onlineVerify: {
          level: 'full',
          url: 'https://kcmark.kr',
          note: '국가기술표준원 KC 인증 통합정보시스템에서 인증번호로 유효성을 실시간 조회할 수 있습니다.',
        },
      },
    ],
  },

  // ───────────────────────── 미국 ─────────────────────────
  {
    code: 'US',
    nameKo: '미국',
    nameEn: 'United States',
    flag: '🇺🇸',
    regulations: [
      {
        id: 'US_TSCA',
        nameKo: 'TSCA 화학물질 목록 신고',
        nameEn: 'TSCA Chemical Data Reporting (EPA)',
        nativeTerm: 'Toxic Substances Control Act (TSCA)',
        authority: 'U.S. EPA',
        authorityUrl: 'https://www.epa.gov/tsca-inventory',
        description:
          '독성물질관리법(TSCA) 에 따라 미국에서 제조·수입되는 화학물질은 EPA TSCA 목록에 등재되어야 합니다. ' +
          '연간 25,000 lbs 이상 제조·수입 시 Chemical Data Reporting(CDR) 신고 의무가 있습니다.',
        appliesToType: 'chemical',
        requiredAck: true,
        permitNumberLabel: 'TSCA 신고 확인번호 (해당 시)',
        permitNumberPh: 'CDR Submission No.',
        uploadLabel: 'TSCA 신고 확인서 또는 TSCA 적합 선언서 (PDF)',
        onlineVerify: {
          level: 'partial',
          url: 'https://comptox.epa.gov/dashboard',
          note: 'EPA CompTox Dashboard에서 CAS 번호로 TSCA 목록 등재 여부를 조회할 수 있습니다. 개별 CDR 신고 내역 확인은 불가합니다.',
        },
      },
      {
        id: 'US_DEA',
        nameKo: 'DEA Schedule 전구물질 허가',
        nameEn: 'DEA Controlled Substance / Listed Chemical Registration',
        nativeTerm: 'DEA Controlled Substance Registration',
        authority: 'U.S. Drug Enforcement Administration (DEA)',
        authorityUrl: 'https://www.deadiversion.usdoj.gov',
        description:
          '마약류 전구물질(Listed Chemicals) 및 규제약물(Controlled Substances)을 취급하는 경우 DEA 등록 및 허가가 필요합니다. ' +
          'Schedule I·II 물질은 별도 허가가 필요하며, List I·II 화학물질도 등록 의무가 있습니다.',
        appliesToType: 'chemical',
        requiredAck: false,
        permitNumberLabel: 'DEA Registration Number (해당 시)',
        permitNumberPh: 'AB1234567',
        uploadLabel: 'DEA 등록증 사본 (PDF)',
        onlineVerify: {
          level: 'none',
          note: 'DEA 등록 현황은 공개 조회 시스템이 없습니다. 제출된 번호를 BidVibe 운영팀이 공문으로 확인합니다.',
        },
      },
      {
        id: 'US_SDS_OSHA',
        nameKo: 'OSHA HazCom SDS (GHS 준수)',
        nameEn: 'OSHA Hazard Communication – SDS (GHS)',
        nativeTerm: 'OSHA HazCom / GHS',
        authority: 'U.S. OSHA',
        authorityUrl: 'https://www.osha.gov/hazcom',
        description:
          '미국 OSHA HazCom 2012 기준(GHS 채택)에 따라 위험화학물질에는 영문 SDS와 경고 라벨이 필수입니다. ' +
          '공급자는 수령자에게 최신 SDS를 반드시 제공해야 합니다.',
        appliesToType: 'chemical',
        requiredAck: true,
        uploadLabel: 'SDS 샘플 (영문, PDF)',
        onlineVerify: {
          level: 'none',
          note: '미국 OSHA는 SDS 중앙 DB를 운영하지 않습니다. 공급자가 직접 작성하며, 플랫폼 내 업로드로 갈음합니다.',
        },
      },
      {
        id: 'US_FCC',
        nameKo: 'FCC 인증 (전자 장비)',
        nameEn: 'FCC Authorization (Electronic Equipment)',
        nativeTerm: 'FCC Part 15 / Equipment Authorization',
        authority: 'Federal Communications Commission',
        authorityUrl: 'https://www.fcc.gov/oet/ea/fccid',
        description:
          '미국에서 판매되는 전파 발신 장비는 FCC 인증(Certification 또는 SDoC)이 필요합니다.',
        appliesToType: 'equipment',
        requiredAck: true,
        permitNumberLabel: 'FCC ID',
        permitNumberPh: '예) A3LSMG900F',
        uploadLabel: 'FCC 인증서 (PDF)',
        onlineVerify: {
          level: 'full',
          url: 'https://www.fcc.gov/oet/ea/fccid',
          note: 'FCC ID Search 시스템에서 FCC ID를 입력하면 인증 정보를 실시간으로 조회할 수 있습니다.',
        },
      },
    ],
  },

  // ───────────────────────── EU ─────────────────────────
  {
    code: 'EU',
    nameKo: '유럽연합 (EU)',
    nameEn: 'European Union',
    flag: '🇪🇺',
    regulations: [
      {
        id: 'EU_REACH',
        nameKo: 'REACH 등록 / SVHC 허가',
        nameEn: 'REACH Registration & SVHC Authorisation (ECHA)',
        nativeTerm: 'REACH Regulation (EC 1907/2006)',
        authority: 'European Chemicals Agency (ECHA)',
        authorityUrl: 'https://echa.europa.eu',
        description:
          '연간 1톤 이상 EU 시장에 공급하는 화학물질은 REACH(EC 1907/2006) 규정에 따라 ECHA에 등록해야 합니다. ' +
          'SVHC(고위험우려물질) 포함 제품은 추가 허가가 필요하며, 제조자·수입자·유일대리인(OR) 중 하나가 등록 의무를 집니다.',
        appliesToType: 'chemical',
        requiredAck: true,
        permitNumberLabel: 'REACH 등록번호 (해당 시)',
        permitNumberPh: '01-XXXXXXXXXX-XX-XXXX',
        uploadLabel: 'REACH 등록 확인서 또는 OR 위임장 (PDF)',
        onlineVerify: {
          level: 'full',
          url: 'https://echa.europa.eu/information-on-chemicals',
          note: 'ECHA 공식 DB에서 CAS 번호/물질명으로 REACH 등록 현황, SVHC 목록, 허가 목록을 무료로 조회할 수 있습니다.',
        },
      },
      {
        id: 'EU_CLP',
        nameKo: 'CLP 분류·표시 준수 (GHS)',
        nameEn: 'CLP Regulation – Classification, Labelling & Packaging',
        nativeTerm: 'CLP Regulation (EC 1272/2008)',
        authority: 'ECHA / EU 회원국 당국',
        authorityUrl: 'https://echa.europa.eu/regulations/clp',
        description:
          'EU CLP 규정(EC 1272/2008)에 따라 위험 화학물질 및 혼합물은 GHS 기반 분류·표시·포장 기준을 충족해야 합니다. ' +
          '공급자는 C&L 정보를 ECHA에 신고해야 합니다.',
        appliesToType: 'chemical',
        requiredAck: true,
        uploadLabel: 'SDS (EU 규정 준수, 영문 또는 현지어, PDF)',
        onlineVerify: {
          level: 'full',
          url: 'https://echa.europa.eu/information-on-chemicals/cl-inventory-database',
          note: 'ECHA C&L Inventory에서 물질의 분류·표시 정보를 공개 조회할 수 있습니다.',
        },
      },
      {
        id: 'EU_CE',
        nameKo: 'CE 마킹 (장비·의료기기)',
        nameEn: 'CE Marking',
        nativeTerm: 'Conformité Européenne (CE)',
        authority: 'EU 회원국 시장감시기관',
        authorityUrl: 'https://ec.europa.eu/growth/single-market/ce-marking',
        description:
          'EU 내 판매되는 기계, 전기전자 장비, 의료기기 등은 관련 EU 지침(LVD, EMC, MDR 등)을 준수하고 CE 마킹을 부착해야 합니다.',
        appliesToType: 'equipment',
        requiredAck: true,
        permitNumberLabel: 'CE 선언서 번호 (DoC No.)',
        permitNumberPh: 'DoC-XXXX-XXXX',
        uploadLabel: 'EU 적합성 선언서 (DoC, PDF)',
        onlineVerify: {
          level: 'partial',
          url: 'https://ec.europa.eu/growth/tools-databases/nando/',
          note: 'NANDO 데이터베이스에서 인증기관(Notified Body) 정보를 조회할 수 있으나, 개별 제품 CE DoC는 공개 DB가 없습니다.',
        },
      },
    ],
  },

  // ───────────────────────── 일본 ─────────────────────────
  {
    code: 'JP',
    nameKo: '일본',
    nameEn: 'Japan',
    flag: '🇯🇵',
    regulations: [
      {
        id: 'JP_KASHIN',
        nameKo: '화심법 신규 화학물질 신고',
        nameEn: 'Chemical Substances Control Law (化審法) – New Substance Notification',
        nativeTerm: '化学物質の審査及び製造等の規制に関する法律 (化審法)',
        authority: '経済産業省 · 厚生労働省 · 環境省',
        authorityUrl: 'https://www.meti.go.jp/policy/chemical_management/kasinhou/',
        description:
          '화학물질심사규제법(化審法)에 따라 일본 시장에 공급하는 신규 화학물질은 사전 심사 신고(届出)가 필요합니다. ' +
          '第一種 특정화학물질(PCB, 수은 등)은 제조·수입이 원칙 금지되어 있습니다.',
        appliesToType: 'chemical',
        requiredAck: true,
        permitNumberLabel: '화심법 신고번호 (해당 시)',
        permitNumberPh: '例) 化審-XXXX-XXXXX',
        uploadLabel: '화심법 신고 수리 통지서 (PDF)',
        onlineVerify: {
          level: 'partial',
          url: 'https://www.nite.go.jp/chem/kasinn/index.html',
          note: '独立行政法人 製品評価技術基盤機構(NITE) 화학물질 DB에서 기존 목록 등재 여부를 조회할 수 있습니다. 개별 신고 확인은 불가합니다.',
        },
      },
      {
        id: 'JP_ANWEI',
        nameKo: '안위법 SDS · 표시 의무',
        nameEn: 'Industrial Safety and Health Act (安衛法) – SDS & Labelling',
        nativeTerm: '労働安全衛生法 (安衛法) 第57条',
        authority: '厚生労働省',
        authorityUrl: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/anzen/anzeneisei36/index.html',
        description:
          '노동안전위생법(安衛法) 57조에 따라 지정 화학물질을 양도·제공할 때는 일본어 SDS와 용기 표시가 의무입니다. ' +
          '2023년 개정으로 GHS 분류 대상이 대폭 확대되었습니다.',
        appliesToType: 'chemical',
        requiredAck: true,
        uploadLabel: 'SDS (일본어, PDF)',
        onlineVerify: {
          level: 'none',
          note: '일본은 중앙 SDS 등록 시스템이 없습니다. 공급자 자체 작성 SDS를 플랫폼에 업로드해 주세요.',
        },
      },
      {
        id: 'JP_DOKUGEKI',
        nameKo: '독물·극물취급책임자 선임',
        nameEn: 'Poisonous and Deleterious Substances Control Act (毒劇物取締法)',
        nativeTerm: '毒物及び劇物取締法 (毒劇物)',
        authority: '都道府県知事',
        authorityUrl: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iyakuhin/doku/',
        description:
          '독물·극물(毒物·劇物)을 판매·수입하는 경우 도도부현 등록 및 취급책임자 선임이 필요합니다. ' +
          '예: 시안화칼륨, 염화수소, 황산 등이 해당합니다.',
        appliesToType: 'chemical',
        requiredAck: false,
        permitNumberLabel: '毒劇物 판매업 등록번호 (해당 시)',
        permitNumberPh: '例) 東京都第XXXXX号',
        uploadLabel: '毒劇物 판매업 등록증 (PDF)',
        onlineVerify: {
          level: 'none',
          note: '도도부현별 관할이라 통합 온라인 조회 시스템이 없습니다. BidVibe 운영팀이 서면으로 확인합니다.',
        },
      },
      {
        id: 'JP_PSE',
        nameKo: 'PSE 마크 (전기용품 안전법)',
        nameEn: 'Electrical Appliance and Material Safety Act (電安法) – PSE Mark',
        nativeTerm: '電気用品安全法 (電安法) / PSEマーク',
        authority: '経済産業省',
        authorityUrl: 'https://www.meti.go.jp/policy/consumer/seian/denanho/',
        description:
          '일본에서 판매되는 전기용품은 전기용품안전법에 따라 PSE(丸PSE 또는 菱PSE) 마크를 취득해야 합니다.',
        appliesToType: 'equipment',
        requiredAck: true,
        permitNumberLabel: 'PSE 신고번호 (해당 시)',
        permitNumberPh: '例) 経産省 届出番号 XXXXXXXX',
        uploadLabel: 'PSE 적합성 시험 보고서 (PDF)',
        onlineVerify: {
          level: 'partial',
          url: 'https://www.meti.go.jp/policy/consumer/seian/denanho/tekigouhin.html',
          note: '経済産業省 적합품 목록에서 일부 제품 조회가 가능합니다. 특정 전기용품(丸PSE)은 제3자 인증기관을 통한 확인이 필요합니다.',
        },
      },
    ],
  },

  // ───────────────────────── 중국 ─────────────────────────
  {
    code: 'CN',
    nameKo: '중국',
    nameEn: "People's Republic of China",
    flag: '🇨🇳',
    regulations: [
      {
        id: 'CN_IECSC',
        nameKo: 'IECSC 기존화학물질 목록 확인',
        nameEn: 'Inventory of Existing Chemical Substances in China (IECSC)',
        nativeTerm: '现有化学物质名录 (IECSC)',
        authority: '生态环境部 (MEE)',
        authorityUrl: 'https://www.mee.gov.cn',
        description:
          '중국에 수출·공급하는 화학물질이 기존화학물질목록(IECSC)에 등재되어 있어야 합니다. ' +
          '미등재 물질은 신화학물질 등기(新化学物质环境管理登记) 절차를 거쳐야 수출이 가능합니다.',
        appliesToType: 'chemical',
        requiredAck: true,
        uploadLabel: 'IECSC 조회 결과 또는 신화학물질 등기증 (PDF)',
        onlineVerify: {
          level: 'partial',
          url: 'https://www.cirs-group.com/services/china-chemicals/iecsc',
          note: 'CIRS 또는 MEE 공식 홈페이지에서 CAS 번호로 IECSC 등재 여부를 수동 조회할 수 있습니다. 실시간 API는 미제공입니다.',
        },
      },
      {
        id: 'CN_HAZMAT_LICENSE',
        nameKo: '危险化学品 경영허가증',
        nameEn: 'Hazardous Chemical Business License (危险化学品经营许可证)',
        nativeTerm: '危险化学品经营许可证',
        authority: '应急管理部 (Emergency Management Ministry)',
        authorityUrl: 'https://www.mem.gov.cn',
        description:
          '위험화학품(危险化学品)을 경영·판매하는 기업은 应急管理부 또는 성·시급 당국으로부터 경영허가증을 취득해야 합니다. ' +
          '국가标准 GB 13690에 따른 위험화학품 분류 기준을 참고하세요.',
        appliesToType: 'chemical',
        requiredAck: true,
        permitNumberLabel: '危化品 경영허가증 번호',
        permitNumberPh: '例) (粤)危化经字[20XX]XXXXX号',
        uploadLabel: '危险化学品 경영허가증 사본 (PDF)',
        onlineVerify: {
          level: 'partial',
          url: 'https://www.mem.gov.cn/gk/tzgg/',
          note: '应急管理部 공식 홈페이지에서 허가 현황을 부분적으로 조회할 수 있으나, 공개 API가 없어 자동 검증은 불가합니다. BidVibe 운영팀이 서면으로 교차 확인합니다.',
        },
      },
      {
        id: 'CN_NEW_CHEM',
        nameKo: '新化学物质 환경관리 등기',
        nameEn: 'New Chemical Substance Environmental Management Registration',
        nativeTerm: '新化学物质环境管理登记',
        authority: '生态环境部 (MEE) / 화학품등기센터',
        authorityUrl: 'https://www.mee.gov.cn',
        description:
          'IECSC 미등재 신규 화학물질을 중국에 공급하려면 MEE에 환경관리 등기(登记)를 신청해야 합니다. ' +
          '2021년 개정된 新化学物质环境管理登记办法이 적용됩니다. 간이신고/常规登记/重点环境管理登记 3단계로 분류됩니다.',
        appliesToType: 'chemical',
        requiredAck: false,
        permitNumberLabel: '신화학물질 등기번호 (해당 시)',
        permitNumberPh: '例) MEE-20XX-XXXXX',
        uploadLabel: '新化学物质 등기증 (PDF)',
        onlineVerify: {
          level: 'none',
          note: '현재 MEE 등기 현황을 외부에서 조회할 수 있는 공개 시스템이 없습니다. 등기증 원본을 업로드해 주세요.',
        },
      },
      {
        id: 'CN_SDS_GB',
        nameKo: 'SDS (GB/T 16483 기준)',
        nameEn: 'Safety Data Sheet – Chinese Standard (GB/T 16483)',
        nativeTerm: '安全技术说明书 (SDS / GB/T 16483)',
        authority: '国家标准化管理委员会 (SAC)',
        authorityUrl: 'https://www.sac.gov.cn',
        description:
          '중국에 공급하는 화학물질에는 중국어(简体) SDS를 GB/T 16483 및 GB/T 17519 기준에 따라 작성하여 제공해야 합니다. ' +
          'GHS 7th Revision 기반이나 중국 고유 요건이 추가되어 있습니다.',
        appliesToType: 'chemical',
        requiredAck: true,
        uploadLabel: 'SDS (중국어 간체, PDF)',
        onlineVerify: {
          level: 'none',
          note: '중국 SDS 중앙 등록 DB가 없습니다. 공급자 자체 작성 SDS를 업로드해 주세요.',
        },
      },
      {
        id: 'CN_CCC',
        nameKo: 'CCC 인증 (中国强制认证)',
        nameEn: 'China Compulsory Certification (3C / CCC)',
        nativeTerm: '中国强制认证 (3C / CCC)',
        authority: '国家认证认可监督管理委员会 (CNCA)',
        authorityUrl: 'https://www.cnca.gov.cn',
        description:
          '중국에 수입·판매되는 전기전자 제품, 자동차 부품 등 지정 품목은 CCC(3C) 인증이 의무입니다. ' +
          '인증 없이 판매 시 세관 통관 거부 및 벌금이 부과됩니다.',
        appliesToType: 'equipment',
        requiredAck: true,
        permitNumberLabel: 'CCC 인증번호',
        permitNumberPh: '例) 2023010XXXXXXXXXX',
        uploadLabel: 'CCC 인증서 사본 (PDF)',
        onlineVerify: {
          level: 'full',
          url: 'https://www.cnca.gov.cn/bsdt/xxcx/rzcxpt/',
          note: 'CNCA 공식 인증정보 조회 시스템에서 CCC 인증번호 또는 기업명으로 인증 현황을 직접 조회할 수 있습니다.',
        },
      },
    ],
  },

  // ───────────────────────── 기타 ─────────────────────────
  {
    code: 'OTHER',
    nameKo: '기타 국가',
    nameEn: 'Other Country',
    flag: '🌐',
    regulations: [
      {
        id: 'OTHER_GENERAL',
        nameKo: '현지 인증·규제 준수 선언',
        nameEn: 'General Regulatory Compliance Declaration',
        authority: '해당 국가 담당기관',
        description:
          '본사 소재 국가의 화학물질·장비 관련 법령을 준수하고 있으며, 요청 시 관련 인증서를 제출할 것에 동의합니다.',
        appliesToType: 'both',
        requiredAck: true,
        uploadLabel: '현지 규제 인증서 또는 준수 선언서 (PDF — 화학물질 허가증, 장비 인증서 등 해당 서류)',
        onlineVerify: {
          level: 'none',
          note: '기타 국가의 경우 자동 온라인 조회가 지원되지 않습니다. BidVibe 운영팀이 개별 검토합니다.',
        },
      },
    ],
  },
]

// ─── 유틸리티 ───

export const COUNTRY_MAP: Record<CountryCode, CountryConfig> = Object.fromEntries(
  COUNTRY_REGULATIONS.map(c => [c.code, c])
) as Record<CountryCode, CountryConfig>

/** 국가 + 공급 유형에 맞는 규제 목록 반환 */
export function getRegulations(
  countryCode: CountryCode,
  supplyType: 'chemical' | 'equipment' | 'both'
): CountryRegulation[] {
  const config = COUNTRY_MAP[countryCode]
  if (!config) return []
  return config.regulations.filter(r =>
    r.appliesToType === 'both' ||
    r.appliesToType === supplyType ||
    supplyType === 'both'
  )
}

/** 온라인 조회 가능 여부 레이블 (i18n key 참조: reg.verifyFull / reg.verifyPartial / reg.verifyNone) */
export const VERIFY_LABEL: Record<VerifyLevel, { text: string; color: string }> = {
  full:    { text: '온라인 조회 가능', color: 'text-green-700' },
  partial: { text: '부분 조회 가능',   color: 'text-amber-700' },
  none:    { text: '온라인 조회 불가', color: 'text-red-700' },
}
