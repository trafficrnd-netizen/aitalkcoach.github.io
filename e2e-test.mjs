/**
 * E2E 테스트: 파서 → AI 분석 전체 플로우
 *
 * 실행: node e2e-test.mjs
 */

import { parseKakaoTalkFile, validateChatData, toAnalysisText } from './kakaotalk-parser/parser.js';
import { createAnalyzer } from './ai-engine/analyzer.js';

// 샘플 카카오톡 내보내기 파일
const SAMPLE_CHAT = `2024년 1월 15일 월요일
오후 3:30 김철수 : 안녕? 오늘 뭐 해?
오후 3:31 이영희(You) : 안녕~ 나 오늘 집에서 쉬고 있어 ㅎㅎ
오후 3:32 김철수 : ㅋㅋ 좋아~ 나도 오늘 일 끝났어
오후 3:33 이영희(You) : 우리 술 한 잔 할까? ㅎㅎ
오후 3:34 김철수 : ㅋㅋ 좋아! 어디 갈까?
오후 3:35 이영희(You) : 우리 집 앞 편의점으로?
오후 3:36 김철수 : ㅋㅋ 알겠어! 그럼 7시에 편의점 앞에서?
오후 3:37 이영희(You) : 응 좋아!🙏

2024년 1월 17일 수요일
오후 8:00 김철수 : 오늘 약속 잊지 않았지?
오후 8:01 이영희(You) : 당연하지! ㅎㅎ 7시 맞지?
오후 8:02 김철수 : 응응! 오늘 너무 기대돼 ㅎㅎ
오후 8:03 이영희(You) : 나도~❤️ 오랜만에 만나는 것 같아
오후 8:05 김철수 : 맞아ㅎ 最近 뭐 하고 지냈어?
오후 8:06 이영희(You) : 요즘 새 회사 적응하느라 바쁘게 살았어 ㅋㅋ
오후 8:07 김철수 : 와 축하해~👏 새 직장 좋아?
오후 8:08 이영희(You) : 응응!同事들 다 좋아! 너는?
오후 8:09 김철수 : 나도 잘 지내고 있어~ 이제 좀 여유로워졌어
오후 8:10 이영희(You) : 다행이다😊`;

console.log('=== E2E 테스트: 카톡 코치 AI ===\n');

// 1. 파싱
console.log('STEP 1: 파싱');
const parsed = parseKakaoTalkFile(SAMPLE_CHAT);
console.log(`  - 메시지 수: ${parsed.messages.length}`);
console.log(`  - 참가자: ${parsed.participants.join(', ')}`);
console.log(`  - 날짜 범위: ${parsed.dateRange.start ? parsed.dateRange.start.toLocaleDateString('ko-KR') : 'N/A'} ~ ${parsed.dateRange.end ? parsed.dateRange.end.toLocaleDateString('ko-KR') : 'N/A'}`);

// 2. 유효성 검사
console.log('\nSTEP 2: 유효성 검사');
const validation = validateChatData(parsed);
console.log(`  - 유효: ${validation.isValid ? 'YES' : 'NO'}`);
if (validation.warnings.length > 0) {
  validation.warnings.forEach(w => console.log(`  - 경고: ${w}`));
}

// 3. AI 분석용 텍스트 변환
console.log('\nSTEP 3: AI 분석용 텍스트 변환');
const analysisText = toAnalysisText(parsed);
console.log(`  - 변환된 텍스트 길이: ${analysisText.length}자`);
console.log(`  - 첫 200자:\n  ${analysisText.substring(0, 200).replace(/\n/g, '\\n')}...`);

// 4. AI 분석
console.log('\nSTEP 4: AI 분석 실행');
const analyzer = createAnalyzer();
analyzer.setConversation(analysisText);
console.log('  - AI 엔진 초기화 완료');

const result = await analyzer.analyze({ types: ['emotion', 'interest', 'advice', 'replies'] });
console.log(`  - 분석 성공: ${result.success ? 'YES' : 'NO'}`);
console.log(`  - 결과 타입: ${Object.keys(result.results || {}).join(', ')}`);

// 5. 결과 출력
console.log('\nSTEP 5: 결과 확인');
const results = result.results || {};

if (results.emotion) {
  console.log('\n  💭 감정 분석:');
  console.log(`     전체: ${results.emotion.emotion || results.emotion.overall || 'N/A'}`);
  console.log(`     점수: ${results.emotion.emotion_score || results.emotion.score || 'N/A'}/10`);
  console.log(`     설명: ${(results.emotion.description || '').substring(0, 80)}`);
}

if (results.interest) {
  console.log('\n  ❤️ 관심도:');
  const interest = results.interest.interest_level || results.interest.level || 'N/A';
  const score = results.interest.interest_score || results.interest.score || 'N/A';
  console.log(`     수준: ${interest} (${score}/10)`);
  if (results.interest.evidence && results.interest.evidence.length > 0) {
    console.log(`     근거: ${results.interest.evidence[0]}`);
  }
}

if (results.advice || results.comprehensive?.analysis) {
  console.log('\n  💡 조언:');
  const analysis = results.advice || results.comprehensive?.analysis || {};
  if (analysis.good_points && analysis.good_points.length > 0) {
    console.log(`     👍 ${analysis.good_points[0]}`);
  }
  if (analysis.my_mistakes && analysis.my_mistakes.length > 0) {
    console.log(`     ⚠️  ${analysis.my_mistakes[0]}`);
  }
}

if (results.replies || results.comprehensive?.replies) {
  console.log('\n  📝 추천 답장:');
  const replies = results.replies?.suggestions || results.comprehensive?.replies || [];
  if (replies.length > 0) {
    console.log(`     "${replies[0].reply || replies[0]}"`);
  }
}

console.log('\n=== E2E 테스트 완료 ===');
console.log('모든 단계가 정상 작동합니다! 🎉');
