/**
 * 카카오톡 파서 단위 테스트
 *
 * parser.js의 모든 함수를 테스트합니다.
 * 실행: node kakaotalk-parser/parser.test.js
 */

import {
  parseKakaoTalkFile,
  validateChatData,
  toAnalysisText,
} from './parser.js';

// ===== 테스트 헬퍼 =====
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${error.message}`);
    testsFailed++;
  }
}

function assertEqual(actual, expected, message = '') {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message}\n     Expected: ${JSON.stringify(expected)}\n     Actual:   ${JSON.stringify(actual)}`
    );
  }
}

function assertTrue(value, message = '') {
  if (!value) {
    throw new Error(`${message || 'Assertion failed'}\n     Expected: truthy\n     Actual: ${value}`);
  }
}

function assertFalse(value, message = '') {
  if (value) {
    throw new Error(`${message || 'Assertion failed'}\n     Expected: falsy\n     Actual: ${value}`);
  }
}

// ===== 테스트 데이터 =====
const SAMPLE_CHAT = `2024년 1월 15일 월요일
오후 3:30 김철수 : 안녕?
오후 3:31 이영희(You) : 안녕~ 잘 지내?
오후 3:32 김철수 : 응 잘 지내~ 너는?
오후 3:33 이영희(You) : 나도! 오랜만이야 ㅎㅎ
오후 3:35 김철수 : ㅋㅋ 진짜 오래됐지
오후 3:37 이영희(You) : 맞아ㅎ 最近 뭐하고 있어?
오후 3:38 김철수 : 바쁘게 살지~ㅋㅋ`;

const EMPTY_CHAT = '';

const SINGLE_MESSAGE_CHAT = `2024년 1월 15일 월요일
오후 3:30 김철수 : 안녕?`;

const MULTI_DAY_CHAT = `2024년 1월 15일 월요일
오후 3:30 김철수 : 안녕?

2024년 1월 16일 화요일
오전 10:30 김철수 : 일어나는 거야?

2024년 1월 17일 수요일
오후 8:00 이영희(You) : 응응`;

const SENSITIVE_CHAT = `2024년 1월 15일 월요일
오후 3:30 김철수 : 내 번호 010-1234-5678 이야
오후 3:31 이영희(You) : 메모했어!
오후 3:32 김철수 : 우리 집 주소는 서울시 강남구 테헤란로 123이야
오후 3:33 이영희(You) : ㅎㅎ 알겠어`;

const EMOJI_CHAT = `2024년 1월 15일 월요일
오후 3:30 김철수 : 안녕~❤️
오후 3:31 이영희(You) : 안녕!😍
오후 3:32 김철수 : 우리 오늘 만날까?🥺
오후 3:33 이영희(You) : 좋아!❤️❤️`;

const LONG_MESSAGE_CHAT = `2024년 1월 15일 월요일
오후 3:30 김철수 : 안녕? 너 요즘 잘 지내? 나 좀 궁금해서 연락했어. 사실 말이야, 요즘 너무 바쁘면서도 심심하고 그랬어. 너는 어떠세요?
오후 3:31 이영희(You) : 안녕~ 나도 잘 지내! 오빠가 먼저 연락하니까 놀랐어 ㅎㅎ`;

// ===== 테스트 실행 =====
console.log('\n=== 카카오톡 파서 테스트 ===\n');

// --- parseKakaoTalkFile ---
console.log('📦 parseKakaoTalkFile');

test('기본 채팅 파싱', () => {
  const result = parseKakaoTalkFile(SAMPLE_CHAT);
  assertTrue(result.messages && result.messages.length > 0, 'messages 배열이 존재해야 함');
  assertEqual(result.messages.length, 7, '메시지 수');
});

test('빈 파일 처리', () => {
  const result = parseKakaoTalkFile(EMPTY_CHAT);
  assertTrue(result.messages && result.messages.length === 0, '빈 파일은 빈 배열');
  assertTrue(result.error === undefined, '에러 없어야 함');
});

test('단일 메시지 파싱', () => {
  const result = parseKakaoTalkFile(SINGLE_MESSAGE_CHAT);
  assertEqual(result.messages.length, 1, '메시지 1개');
  assertEqual(result.messages[0].sender, '김철수', '발신자');
  assertEqual(result.messages[0].text, '안녕?', '내용');
});

test('다중 날짜 파싱', () => {
  const result = parseKakaoTalkFile(MULTI_DAY_CHAT);
  const dates = [...new Set(result.messages.map((m) => m.date))];
  assertEqual(dates.length, 3, '3개의 날짜');
});

test('내 메시지 감지 (You)', () => {
  const result = parseKakaoTalkFile(SAMPLE_CHAT);
  const myMessages = result.messages.filter((m) => m.isMe);
  const theirMessages = result.messages.filter((m) => !m.isMe);
  assertTrue(myMessages.length > 0, '내 메시지 존재');
  assertTrue(theirMessages.length > 0, '상대 메시지 존재');
  assertEqual(myMessages[0].sender, '이영희', '내 이름');
});

test('이모지 보존', () => {
  const result = parseKakaoTalkFile(EMOJI_CHAT);
  const emojiMessage = result.messages.find((m) => m.text.includes('❤️'));
  assertTrue(emojiMessage, '이모지가 보존되어야 함');
});

test('긴 메시지 처리', () => {
  const result = parseKakaoTalkFile(LONG_MESSAGE_CHAT);
  assertTrue(result.messages.length >= 2, '최소 2개 메시지');
  const longMsg = result.messages[0];
  assertTrue(longMsg.text.length > 50, '긴 텍스트 보존');
});

// --- validateChatData ---
console.log('\n✅ validateChatData');

test('유효한 데이터 검사', () => {
  const parsed = parseKakaoTalkFile(SAMPLE_CHAT);
  const validation = validateChatData(parsed);
  assertTrue(validation.isValid, '유효해야 함');
  assertEqual(validation.errors.length, 0, '에러 없어야 함');
});

test('빈 데이터 검사', () => {
  const parsed = parseKakaoTalkFile(EMPTY_CHAT);
  const validation = validateChatData(parsed);
  assertFalse(validation.isValid, '유효하지 않아야 함');
});

test('메시지 수 부족 검사', () => {
  const parsed = parseKakaoTalkFile(SINGLE_MESSAGE_CHAT);
  const validation = validateChatData(parsed);
  assertFalse(validation.isValid, '메시지 1개는 분석 불가');
  assertTrue(validation.errors.some((e) => e.includes('메시지')), '메시지 수 관련 에러');
});

// --- toAnalysisText ---
console.log('\n📝 toAnalysisText');

test('AI 분석용 텍스트 생성', () => {
  const parsed = parseKakaoTalkFile(SAMPLE_CHAT);
  const text = toAnalysisText(parsed);
  assertTrue(typeof text === 'string', '문자열 반환');
  assertTrue(text.length > 0, '빈 문자열 아니어야 함');
  assertTrue(text.includes('김철수') && text.includes('이영희'), '이름 포함');
});

test('빈 데이터 처리', () => {
  const parsed = parseKakaoTalkFile(EMPTY_CHAT);
  const text = toAnalysisText(parsed);
  assertTrue(text.length === 0 || text.includes('없음'), '빈 데이터 처리');
});

// --- 민감정보 마스킹 ---
console.log('\n🔒 민감정보 마스킹');

test('전화번호 마스킹', () => {
  const parsed = parseKakaoTalkFile(SENSITIVE_CHAT);
  const text = toAnalysisText(parsed);
  assertFalse(text.includes('010-1234-5678'), '전화번호 마스킹됨');
});

test('주소 마스킹', () => {
  const parsed = parseKakaoTalkFile(SENSITIVE_CHAT);
  const text = toAnalysisText(parsed);
  assertFalse(text.includes('서울시 강남구'), '주소 마스킹됨');
});

// ===== 결과 요약 =====
console.log('\n=== 테스트 결과 ===');
console.log(`✅ 통과: ${testsPassed}`);
console.log(`❌ 실패: ${testsFailed}`);
console.log(`계: ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.log('\n⚠️  일부 테스트가 실패했습니다.');
  process.exit(1);
} else {
  console.log('\n🎉 모든 테스트 통과!');
  process.exit(0);
}
