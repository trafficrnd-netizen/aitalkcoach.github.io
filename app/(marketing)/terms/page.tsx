export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-12 px-4">
      <h1 className="text-2xl font-bold mb-2">이용약관</h1>
      <p className="text-sm text-muted-foreground mb-8">최종 업데이트: 2026년 5월 18일</p>

      <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="text-base font-semibold mb-2">제1조 (목적)</h2>
          <p>
            이 약관은 BidVibe(이하 &ldquo;서비스&rdquo;)가 제공하는 연구 조달 역경매 중개 서비스의 이용 조건 및 절차, 이용자와 서비스 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">제2조 (서비스의 성격)</h2>
          <p>
            BidVibe는 연구자(수요자)와 공급자(판매자)를 연결하는 중개 플랫폼으로, 실제 거래의 당사자가 아닙니다. 거래에 관한 계약은 연구자와 공급자 사이에서 직접 체결되며, BidVibe는 이에 대한 책임을 지지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">제3조 (가입 자격)</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>연구자: 기업·기관·학교 이메일 보유자에 한해 베타 참여 가능</li>
            <li>공급자: 국세청에 등록된 사업자번호 보유 법인 또는 개인사업자</li>
            <li>개인 이메일(gmail, naver 등)로는 가입할 수 없습니다</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">제4조 (서비스 이용)</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>연구자의 서비스 이용은 무료입니다</li>
            <li>공급자는 플랜에 따라 구독료가 발생할 수 있습니다</li>
            <li>입찰 금액은 낙찰 전까지 공개되지 않습니다(Sealed Bid)</li>
            <li>낙찰가 및 거래 정보는 거래 당사자에게만 공개되며 타 공급사에 공개되지 않습니다</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">제5조 (금지 행위)</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>허위 견적 또는 허위 요청 등록</li>
            <li>타인의 계정 도용</li>
            <li>서비스 외부에서의 직접 거래를 통한 플랫폼 우회</li>
            <li>관련 법령(화관법·화평법·산업안전보건법 등)을 위반하는 거래 행위</li>
            <li>취급 허가를 받지 아니한 유해화학물질의 판매·중개 시도</li>
            <li>기타 관련 법령 위반 행위</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">제6조 (면책)</h2>
          <p>
            BidVibe는 연구자와 공급자 간의 거래 분쟁, 견적의 정확성, 납품 품질 등에 대해 책임을 지지 않습니다. 서비스는 중개 기능만을 제공합니다.
          </p>
        </section>

        <section className="rounded-lg border-l-4 border-amber-400 bg-amber-50 pl-4 py-3 space-y-3">
          <h2 className="text-base font-semibold mb-2">제7조 (화학물질 관련 법령 준수 의무)</h2>
          <p className="font-medium text-amber-900">
            본 서비스를 통해 화학물질을 거래하는 모든 이용자는 아래 법령을 포함한 관계 법령을 스스로 확인하고 준수할 책임이 있습니다.
          </p>
          <div className="space-y-2 text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">① 화학물질관리법(화관법)</p>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                <li>유해화학물질을 판매하는 공급자는 환경부로부터 <strong>유해화학물질 영업허가(판매업)</strong>를 취득해야 합니다 (화관법 제28조).</li>
                <li>유해화학물질은 법정 취급기준에 따라 보관·운반·판매되어야 합니다 (화관법 제13조).</li>
                <li>사고 대비물질(염산·황산·암모니아·불산 등)을 취급하는 경우 추가 의무가 발생합니다 (화관법 제39조).</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">② 화학물질의 등록 및 평가 등에 관한 법률(화평법)</p>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                <li>화학물질 공급자는 구매자에게 <strong>물질안전보건자료(SDS/MSDS)</strong>를 제공해야 합니다 (화평법 제35조).</li>
                <li>GHS 기준에 따른 용기·포장 표지를 부착해야 합니다 (화평법 제36조).</li>
                <li>연간 1톤 이상 제조·수입하는 화학물질은 화평법에 따른 등록이 필요합니다 (화평법 제10조).</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">③ 기타</p>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                <li>마약류 전구물질·폭발물 원료 등 특별 규제 물질은 별도 법령(마약류 관리에 관한 법률, 총포·도검·화약류 등의 안전관리에 관한 법률 등)에 따른 허가가 필요하며, 이를 위반한 거래 요청은 즉시 삭제되고 관계 기관에 신고될 수 있습니다.</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-amber-800 mt-2">
            BidVibe는 거래 중개 플랫폼으로서 이용자의 법령 준수 여부를 실시간으로 보증하지 않습니다. 법령 위반으로 발생하는 모든 민·형사상 책임은 해당 거래 당사자에게 귀속됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">제8조 (공급자의 추가 의무)</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>유해화학물질 취급 공급자는 가입 시 영업허가 여부를 사실대로 고지해야 합니다.</li>
            <li>낙찰 후 납품 시 해당 화학물질의 SDS(물질안전보건자료)를 구매자에게 제공해야 합니다.</li>
            <li>제공한 정보(허가번호, 취급 품목 등)가 허위임이 확인될 경우 계정이 즉시 정지될 수 있습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">제9조 (약관 변경)</h2>
          <p>
            약관이 변경될 경우 서비스 내 공지 또는 가입 시 등록된 이메일로 7일 이전에 안내합니다.
          </p>
        </section>

        <p className="text-muted-foreground border-t border-border pt-4">
          문의: noreply@ai-traffic.kr
        </p>
      </div>
    </div>
  )
}
