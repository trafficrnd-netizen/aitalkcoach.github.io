import type { Metadata } from 'next'
import { LandingShell } from '@/components/landing/landing-shell'

export const metadata: Metadata = {
  title: '영업 없이 연구실 실수요 고객을 만나세요 — BidVibe 공급자',
  description:
    '베타 기간 Pro 1개월 무료 (선착 20개사). 실제 견적 요청에만 입찰하는 효율적 영업. ' +
    '· Pro free for 1 month (first 20 companies). Bid only on real quote requests — no cold outreach.',
  alternates: { canonical: 'https://ai-traffic.kr/landing2' },
  openGraph: {
    title: '연구실 실수요 고객을 만나는 가장 빠른 방법 | Reach Real Lab Buyers, Fast',
    description:
      '시약·소모품 유통사·영업팀을 위한 역경매 B2B 플랫폼. ' +
      '· A reverse-auction B2B platform for reagent & consumable distributors and sales teams.',
    url: 'https://ai-traffic.kr/landing2',
    type: 'website',
    locale: 'ko_KR',
    alternateLocale: ['en_US'],
  },
}

export default function Landing2Page() {
  return (
    <LandingShell
      title="공급자용 랜딩"
      description="연구실 영업 자동화"
      canonicalPath="/landing2"
      badge="🏢 공급자 전용 — Pro 1개월 무료 (선착 20)"
      heroTitle={'영업 없이\n실수요 고객을 만나세요'}
      heroSub="연구실에서 직접 요청한 견적에만 입찰. 콜드콜·전시회 부스 없이 신규 고객 확보."
      ctaPrimary={{ label: 'Pro 무료 시작하기 →', href: '/signup/supplier' }}
      ctaSecondary={{ label: '서비스 더 알아보기', href: '/' }}
      pains={[
        {
          icon: '📵',
          title: '콜드콜 응답률 1%',
          desc: '하루 30통 전화해도 미팅 잡히는 게 1건 안 되는 현실.',
        },
        {
          icon: '🎪',
          title: '전시회 비용 vs 효과',
          desc: '부스 비용 수백만원 들여도 실수요 리드 한 자릿수.',
        },
        {
          icon: '🔍',
          title: '누가 진짜 살까',
          desc: '문의 메일은 와도 실제 구매로 이어지는 비율 낮음.',
        },
      ]}
      steps={[
        { num: '01', title: '카테고리 등록', desc: '취급 품목·지역·납기 가능 범위만 설정. 사업자등록 검증.' },
        { num: '02', title: '실시간 견적 알림', desc: '내 카테고리에 맞는 요청이 올라오면 즉시 알림. 빠른 응답은 낙찰률 ↑.' },
        { num: '03', title: '경쟁 입찰', desc: '단가·납기·조건 제출. 연구자가 비교 후 직접 선택.' },
      ]}
      values={[
        { icon: '🎯', title: '실수요만', desc: '실명·기관 인증된 연구자의 진성 요청' },
        { icon: '⏱️', title: '응답 속도 = 낙찰', desc: '1시간 내 응답 시 크레딧 +2' },
        { icon: '🆓', title: 'Pro 1개월 무료', desc: '베타 기간 선착 20개사 제공' },
        { icon: '🛡️', title: '검증된 입찰자', desc: '사업자등록·위험물 면허 자동 검증' },
      ]}
      proofTitle="공급자에게 이런 가치를 드립니다"
      proofItems={[
        '연구자 본인인증·기관 이메일 인증으로 가짜 요청이 자동으로 걸러집니다.',
        '내 카테고리에 맞는 요청만 알림 → 시간 낭비 없이 핵심 기회만 검토.',
        '1시간 내 응답 시 노출 우선순위와 크레딧 보너스가 즉시 적용됩니다.',
        '카탈로그 업로드·위험물 면허 인증 시 신뢰 배지가 부착됩니다.',
        'Pro 플랜은 무제한 입찰 + 신규 견적 우선 알림 + 분석 리포트 제공.',
      ]}
      finalCtaTitle={'베타 기간\nPro 1개월 무료'}
      finalCtaSub="선착 20개사 한정. 가입 후 카테고리·검증만 등록하면 곧바로 입찰 가능합니다."
    />
  )
}
