import type { Metadata } from 'next'
import { LandingShell } from '@/components/landing/landing-shell'

export const metadata: Metadata = {
  title: '연구실 시약 구매에 매주 4시간 낭비하시나요? — BidVibe',
  description:
    '연구자 완전 무료. 한 번 요청하면 공급사들이 경쟁 견적을 보내줍니다. ' +
    '· Free for researchers. Request once and suppliers send you competitive quotes.',
  alternates: { canonical: 'https://ai-traffic.kr/landing1' },
  openGraph: {
    title: '연구실 구매 시간, 90% 줄여드립니다 | Cut Lab Procurement Time by 90%',
    description:
      '대학원생·연구원·구매담당자를 위한 시약·소모품 역경매 플랫폼. ' +
      '· A reverse-auction platform for reagents & consumables, built for grad students, researchers, and buyers.',
    url: 'https://ai-traffic.kr/landing1',
    type: 'website',
    locale: 'ko_KR',
    alternateLocale: ['en_US'],
  },
}

export default function Landing1Page() {
  return (
    <LandingShell
      title="연구자용 랜딩"
      description="연구실 시약 구매 자동화"
      canonicalPath="/landing1"
      badge="🔬 연구자 전용 — 완전 무료"
      heroTitle={'시약 구매에\n매주 4시간 낭비하시나요?'}
      heroSub="한 번 요청하면 공급사들이 경쟁 견적을 보냅니다. 전화·메일·엑셀 비교, 이제 다 끝."
      ctaPrimary={{ label: '무료 가입 →', href: '/signup/researcher' }}
      ctaSecondary={{ label: '대기자 등록만 먼저', href: '/#waitlist' }}
      pains={[
        {
          icon: '📞',
          title: '끝없는 전화·메일',
          desc: '공급사 5~7곳에 같은 내용을 매번 반복. 답변 받기까지 며칠 대기.',
        },
        {
          icon: '📊',
          title: '엑셀 가격 비교 지옥',
          desc: '단가·운송비·납기 모두 다른 형식의 견적서를 손으로 정리.',
        },
        {
          icon: '⏳',
          title: '교수님 회신 기다리기',
          desc: '결정권자에게 견적서 컨펌 받느라 며칠씩 지연.',
        },
      ]}
      steps={[
        { num: '01', title: '필요한 시약 입력', desc: '제품명·규격·수량만 적으면 끝. 5분 안에 등록 가능.' },
        { num: '02', title: '공급사 자동 알림', desc: '등록된 공급사들에게 즉시 알림. 빠르면 1시간 안에 첫 견적 도착.' },
        { num: '03', title: '비교 후 선택', desc: '가격·납기·신뢰도를 한눈에 비교. 마음에 드는 견적만 선택.' },
      ]}
      values={[
        { icon: '🆓', title: '완전 무료', desc: '연구자에겐 가입비·수수료 0원' },
        { icon: '⚡', title: '5분 등록', desc: '복잡한 양식 없이 핵심만 입력' },
        { icon: '🛡️', title: '신원 검증', desc: '사업자등록·연락처 검증된 공급사' },
        { icon: '📦', title: '시약·소모품·장비 모두', desc: '연구실에서 사는 모든 것 가능' },
      ]}
      proofTitle="실제로 이렇게 달라집니다"
      proofItems={[
        '평균 3~5개 공급사의 경쟁 견적을 한 자리에서 확인합니다.',
        '동일 제품인데 공급사마다 단가가 10~30% 차이나는 경우가 흔합니다.',
        '구매 결재 라인에 정량 비교 자료를 그대로 첨부할 수 있습니다.',
        '본인인증·기관 이메일 인증으로 공급사가 가짜 요청을 거를 수 있습니다.',
      ]}
      finalCtaTitle={'지금 가입하면\n3분 안에 첫 견적 요청'}
      finalCtaSub="대학원생, 박사후과정, 연구실 구매담당자 모두 환영합니다."
    />
  )
}
