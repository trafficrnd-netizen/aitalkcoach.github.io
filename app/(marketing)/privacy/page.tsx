export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-12 px-4">
      <h1 className="text-2xl font-bold mb-2">개인정보처리방침</h1>
      <p className="text-sm text-muted-foreground mb-8">최종 업데이트: 2026년 5월 17일</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
          <p className="font-semibold text-primary">
            BidVibe는 수집된 개인정보를 제3자에게 제공·판매·공유하지 않습니다.
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            낙찰 후 거래 상대방에게 공개되는 최소한의 정보(회사명·연락처)는 회원이 직접 수락한 경우에만 공개되며, 이는 서비스 이용을 위한 필수 공개입니다.
          </p>
        </div>

        <section>
          <h2 className="text-base font-semibold mb-3">1. 수집하는 개인정보</h2>
          <table className="w-full border border-border rounded-lg overflow-hidden text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">구분</th>
                <th className="px-3 py-2 text-left font-medium">수집 항목</th>
                <th className="px-3 py-2 text-left font-medium">수집 목적</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-3 py-2">연구자</td>
                <td className="px-3 py-2">이름, 이메일, 소속기관, 부서/연구실</td>
                <td className="px-3 py-2">서비스 이용, 견적 요청·수신</td>
              </tr>
              <tr>
                <td className="px-3 py-2">공급자</td>
                <td className="px-3 py-2">회사명, 사업자번호, 대표자명, 이메일, 연락처, 주소</td>
                <td className="px-3 py-2">서비스 이용, 입찰, 낙찰 후 거래 진행</td>
              </tr>
              <tr>
                <td className="px-3 py-2">공통(자동)</td>
                <td className="px-3 py-2">접속 로그, 쿠키, IP 주소</td>
                <td className="px-3 py-2">보안, 서비스 개선</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">2. 개인정보 보유 및 이용 기간</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>회원 탈퇴 시까지</li>
            <li>단, 관련 법령에 따라 일정 기간 보존이 필요한 정보는 해당 기간 보존 (예: 전자상거래법상 거래기록 5년)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">3. 개인정보 제3자 제공</h2>
          <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
            <p className="font-medium mb-1">BidVibe는 원칙적으로 개인정보를 제3자에게 제공하지 않습니다.</p>
            <p className="text-muted-foreground text-xs">
              예외: 회원이 직접 견적을 수락하여 거래가 성사된 경우, 거래 진행에 필요한 최소한의 정보(회사명, 연락처)가 거래 상대방에게 공개됩니다. 이는 회원의 명시적 수락 행위를 통해서만 이루어집니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">4. 위탁 처리</h2>
          <table className="w-full border border-border rounded-lg overflow-hidden text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">수탁 업체</th>
                <th className="px-3 py-2 text-left font-medium">위탁 업무</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-3 py-2">Supabase Inc.</td>
                <td className="px-3 py-2">회원 인증 및 데이터베이스 운영</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Vercel Inc.</td>
                <td className="px-3 py-2">서비스 호스팅</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Resend Inc.</td>
                <td className="px-3 py-2">이메일 발송</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">5. 이용자의 권리</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>개인정보 조회·수정·삭제 요청 가능</li>
            <li>동의 철회 및 회원 탈퇴 가능</li>
            <li>문의: noreply@ai-traffic.kr</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">6. 개인정보 보호책임자</h2>
          <p className="text-muted-foreground">이메일: noreply@ai-traffic.kr</p>
        </section>
      </div>
    </div>
  )
}
