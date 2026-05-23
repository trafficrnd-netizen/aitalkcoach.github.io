export type SupplyTopType = 'consumable' | 'labware'

export interface SupplySubCategory {
  code: string
  label: string
}

export const SUPPLY_TOP_TYPES: { value: SupplyTopType; label: string; desc: string; icon: string }[] = [
  { value: 'consumable', label: '소모품', desc: '1회 또는 단기 사용 소모성 용품', icon: '🧴' },
  { value: 'labware',    label: '실험기구', desc: '반복 사용 가능한 실험실 도구·기구', icon: '🔬' },
]

export const SUPPLY_SUB_CATEGORIES: Record<SupplyTopType, SupplySubCategory[]> = {
  consumable: [
    { code: 'tube',             label: '튜브·용기' },
    { code: 'tip',              label: '피펫·팁' },
    { code: 'plate',            label: '플레이트·웰플레이트' },
    { code: 'filter',           label: '필터·멤브레인' },
    { code: 'safety',           label: '안전용품' },
    { code: 'other_consumable', label: '기타 소모품' },
  ],
  labware: [
    { code: 'glassware',        label: '유리기구' },
    { code: 'plastic_labware',  label: '플라스틱 기구' },
    { code: 'analytical_tools', label: '분석·측정 기구' },
    { code: 'other_labware',    label: '기타 실험기구' },
  ],
}

export const SUPPLY_KEYWORDS: Record<string, string[]> = {
  tube: [
    '마이크로튜브 1.5mL',
    '마이크로튜브 2.0mL',
    'Falcon 튜브 15mL',
    'Falcon 튜브 50mL',
    'PCR 튜브 0.2mL',
    '크라이오바이알 (1.8mL)',
    '스크류캡 튜브',
    '딥웰 플레이트용 튜브',
  ],
  tip: [
    '일반 피펫팁 200μL',
    '일반 피펫팁 1000μL',
    '필터 팁 (Filter Tip)',
    '저흡착 팁 (Low-retention)',
    '넓은구경 팁 (Wide-bore)',
    '멀티채널 피펫팁',
    '10μL 팁',
    '다이아팁 (Diamond Tip)',
  ],
  plate: [
    '96-well 플레이트 (Flat-bottom)',
    '96-well 플레이트 (U-bottom)',
    '96-well 플레이트 (V-bottom)',
    '96-well PCR 플레이트',
    '48-well 플레이트',
    '24-well 플레이트',
    '12-well 플레이트',
    '6-well 플레이트',
    '384-well 플레이트',
    '딥웰 플레이트 (2mL)',
  ],
  filter: [
    '시린지 필터 0.22μm (PVDF)',
    '시린지 필터 0.45μm (PVDF)',
    '시린지 필터 0.22μm (MCE)',
    'Nitrocellulose 멤브레인',
    'PVDF 멤브레인 (WB용)',
    '나일론 멤브레인',
    '세포 스트레이너 (40μm)',
    '세포 스트레이너 (70μm)',
    '원심분리 필터 (Amicon Ultra)',
  ],
  safety: [
    '니트릴 장갑 (파우더프리)',
    '라텍스 장갑',
    '내화학성 장갑',
    '안전고글',
    '실험복 (Lab Coat)',
    'KF94 마스크',
    '방진 마스크 (N95)',
    '보안경 (Safety Glasses)',
    '안면 보호대 (Face Shield)',
  ],
  other_consumable: [
    '파라필름 (Parafilm)',
    '알루미늄 포일',
    '킴와이프 (Kimwipe)',
    '실험실 테이프',
    '냉매팩 (Ice Pack)',
    '샘플 라벨 스티커',
    '혈청분리관 (SST)',
    '멸균 면봉',
  ],
  glassware: [
    '비커 (Beaker)',
    '삼각플라스크 (Erlenmeyer)',
    '환저플라스크 (Round-bottom)',
    '메스플라스크 (Volumetric Flask)',
    '메스실린더 (Graduated Cylinder)',
    '분액깔때기 (Separatory Funnel)',
    '부흐너 깔때기',
    '환류냉각기 (Reflux Condenser)',
    '증류장치 세트',
    '피펫 (유리 파스퇴르)',
  ],
  plastic_labware: [
    '세포배양 플라스크 T25',
    '세포배양 플라스크 T75',
    '세포배양 플라스크 T175',
    '페트리디쉬 (60mm)',
    '페트리디쉬 (100mm)',
    '세포 스크래퍼',
    '플라스틱 비커',
    '세포 배양 롤러보틀',
  ],
  analytical_tools: [
    '피펫 컨트롤러 (Pipette Aid)',
    '교반봉 (유리/테플론)',
    '스패튤라·주걱',
    '핀셋 (스테인리스)',
    '실험용 가위',
    'pH 측정 스트립',
    '유리 온도계',
    '버니어 캘리퍼스',
    '마이크로미터',
  ],
  other_labware: [
    '튜브 랙 (Tube Rack)',
    '마이크로플레이트 씰 (Adhesive Seal)',
    '마그네틱 스터러 바',
    '알루미늄 히팅 블록',
    '워터배스 바스켓',
    '진공 데시케이터',
    '타이머·초시계',
    '실험실 저울 (정밀)',
  ],
}
