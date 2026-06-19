import { parseKakaoTalkFile } from './kakaotalk-parser/parser.js';

const testContent = `2024년 1월 15일 월요일
오후 3:30 김철수 : 안녕?
오후 3:31 이영희(You) : 안녕~ 잘 지내?
오후 3:32 김철수 : 응 잘 지내~ 너는?
오후 3:33 이영희(You) : 나도! 오랜만이야 ㅎㅎ`;

const result = parseKakaoTalkFile(testContent);
console.log('Messages count:', result.messages.length);
console.log('First message:', JSON.stringify(result.messages[0], null, 2));
console.log('All messages:', result.messages.map(m => `${m.sender}: ${m.content}`));
