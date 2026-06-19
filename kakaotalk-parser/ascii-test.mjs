// ASCII-only test runner for parser
import { parseKakaoTalkFile, validateChatData, toAnalysisText } from './parser.js';

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`  FAIL: ${name}`);
    console.error(`     ${error.message}`);
    testsFailed++;
  }
}

function assertEqual(actual, expected, msg = '') {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${msg}\n     Expected: ${e}\n     Actual: ${a}`);
  }
}

function assertTrue(value, msg = '') {
  if (!value) throw new Error(`${msg || 'Assertion failed'} - got: ${value}`);
}

function assertFalse(value, msg = '') {
  if (value) throw new Error(`${msg || 'Assertion failed'} - got: ${value}`);
}

const SAMPLE = `2024년 1월 15일 월요일
오후 3:30 김철수 : 안녕?
오후 3:31 이영희(You) : 안녕~ 잘 지내?
오후 3:32 김철수 : 응 잘 지내~ 너는?
오후 3:33 이영희(You) : 나도! 오랜만이야 ㅎㅎ
오후 3:35 김철수 : ㅋㅋ 진짜 오래됐지
오후 3:37 이영희(You) : 맞아ㅎ 最近 뭐하고 있어?
오후 3:38 김철수 : 바쁘게 살지~ㅋㅋ`;

const SINGLE = `2024년 1월 15일 월요일
오후 3:30 김철수 : 안녕?`;

const SENSITIVE = `2024년 1월 15일 월요일
오후 3:30 김철수 : 내 번호 010-1234-5678 이야
오후 3:33 이영희(You) : ㅎㅎ 알겠어`;

console.log('\n=== Parser Tests ===\n');

test('Basic parsing', () => {
  const r = parseKakaoTalkFile(SAMPLE);
  assertTrue(r.messages.length > 0, 'messages exist');
  assertTrue(r.messages.length >= 7, '7 messages, got: ' + r.messages.length);
});

test('Single message parsing', () => {
  const r = parseKakaoTalkFile(SINGLE);
  assertEqual(r.messages.length, 1, '1 message');
  assertEqual(r.messages[0].sender, '김철수', 'sender name');
  assertEqual(r.messages[0].content, '안녕?', 'content');
});

test('My message detection (You)', () => {
  const r = parseKakaoTalkFile(SINGLE);
  // No (You) in SINGLE, so all messages are from them
  const r2 = parseKakaoTalkFile(SAMPLE);
  const myMsgs = r2.messages.filter(m => m.isFromMe);
  const theirMsgs = r2.messages.filter(m => !m.isFromMe);
  assertTrue(myMsgs.length > 0, 'my messages exist');
  assertTrue(theirMsgs.length > 0, 'their messages exist');
});

test('Valid data validation', () => {
  const parsed = parseKakaoTalkFile(SAMPLE);
  const validation = validateChatData(parsed);
  assertTrue(validation.isValid, 'should be valid');
});

test('Empty data validation', () => {
  const parsed = parseKakaoTalkFile('');
  const validation = validateChatData(parsed);
  assertFalse(validation.isValid, 'should be invalid');
});

test('Single message validation fails', () => {
  const parsed = parseKakaoTalkFile(SINGLE);
  const validation = validateChatData(parsed);
  assertFalse(validation.isValid, '1 msg should be invalid');
});

test('toAnalysisText returns string', () => {
  const parsed = parseKakaoTalkFile(SAMPLE);
  const text = toAnalysisText(parsed);
  assertTrue(typeof text === 'string', 'is string');
  assertTrue(text.length > 0, 'not empty');
});

test('Phone number masking', () => {
  const parsed = parseKakaoTalkFile(SENSITIVE);
  const text = toAnalysisText(parsed);
  assertFalse(text.includes('010-1234-5678'), 'phone masked');
});

test('Sender names preserved', () => {
  const parsed = parseKakaoTalkFile(SAMPLE);
  const text = toAnalysisText(parsed);
  assertTrue(text.includes('김철수'), '김철수 preserved');
  assertTrue(text.includes('이영희'), '이영희 preserved');
});

console.log(`\n=== Results: ${testsPassed} passed, ${testsFailed} failed ===\n`);
if (testsFailed > 0) process.exit(1);
