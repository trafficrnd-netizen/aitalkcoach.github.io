/**
 * 카카오톡 대화 파일 파서
 *
 * 카카오톡 내보내기 파일(.txt)을 구조화된 대화 데이터로 변환
 *
 * 지원 형식:
 * - 카카오톡 내보내기 텍스트 파일
 * - 날짜별 그룹화
 * - 다중 대화방 지원
 */

// 정규식 패턴
export const PATTERNS = {
  // 날짜 형식: 2024년 1월 15일 월요일
  datePattern: /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*[\(]?[가-힣]{1,3}[\)]?/,

  // 시간 형식: 오후 3:30 또는 15:30
  timePattern: /(오전|오후)?\s*(\d{1,2}):(\d{2})/,

  // 메시지 형식: 이름 : 메시지
  messagePattern: /^([^:]+)\s*:\s*(.+)$/,

  // 내 메시지: (You)
  myMessagePattern: /\(You\)/,
};

/**
 * 카카오톡 날짜/시간 파싱
 */
function parseDateTime(dateStr, timeStr) {
  // 날짜 파싱
  const dateMatch = dateStr.match(PATTERNS.datePattern);
  if (!dateMatch) return null;

  const year = parseInt(dateMatch[1]);
  const month = parseInt(dateMatch[2]) - 1; // JS의 month는 0부터 시작
  const day = parseInt(dateMatch[3]);

  // 시간 파싱
  let hours = 0;
  let minutes = 0;

  const timeMatch = timeStr.match(PATTERNS.timePattern);
  if (timeMatch) {
    const isPM = timeMatch[1] === '오후';
    hours = parseInt(timeMatch[2]);
    minutes = parseInt(timeMatch[3]);

    // 12시간 → 24시간 변환
    if (isPM && hours !== 12) {
      hours += 12;
    } else if (!isPM && hours === 12) {
      hours = 0;
    }
  }

  return new Date(year, month, day, hours, minutes);
}

/**
 * 단일 메시지 파싱
 */
function parseMessage(line, isMyMessage = false) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // 이미지, 영상, 파일, 음성 메시지 등 스킵
  const skipPatterns = [
    /^(사진|영상|파일|음성|이모티콘|삭제된 메시지)/,
    /^(image|video|file|voice|emoji|deleted)/i,
    /^(카카오톡|KakaoTalk|Kakao)/,
  ];

  for (const pattern of skipPatterns) {
    if (pattern.test(trimmed)) {
      return {
        type: 'media',
        content: trimmed,
        isFromMe: isMyMessage,
      };
    }
  }

  // 일반 메시지 파싱
  const match = trimmed.match(PATTERNS.messagePattern);
  if (match) {
    return {
      type: 'text',
      sender: match[1].trim(),
      content: match[2].trim(),
      isFromMe: isMyMessage || PATTERNS.myMessagePattern.test(match[1]),
    };
  }

  // 파싱 실패 시 일반 텍스트로 처리
  return {
    type: 'text',
    sender: isMyMessage ? '나' : '알 수 없음',
    content: trimmed,
    isFromMe: isMyMessage,
  };
}

/**
 * 카카오톡 파일 파싱 메인 함수
 * @param {string} content - 카카오톡 내보내기 파일 내용
 * @returns {Object} 구조화된 대화 데이터
 */
export function parseKakaoTalkFile(content) {
  const lines = content.split('\n');
  const result = {
    messages: [],
    participants: new Set(),
    dateRange: { start: null, end: null },
    currentDate: null,
    isMyMessage: false,
    errors: [],
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      // 날짜 행 감지
      const dateMatch = line.match(PATTERNS.datePattern);
      if (dateMatch) {
        result.currentDate = line;
        continue;
      }

      // 내 메시지 표시 감지 (플래그만 설정, continue 없이 계속 처리)
      if (line.includes('(You)')) {
        result.isMyMessage = true;
      }

      // 시간 행 감지 (오후 3:30 형식)
      const timeMatch = line.match(PATTERNS.timePattern);
      if (timeMatch && result.currentDate) {
        // 같은 줄에 있을 수 있음: 오후 3:30 이름 : 메시지
        const fullLine = `${result.currentDate} ${line}`;

        // 메시지 추출
        // [FIX] "[오후 3:30] 이름 : 메시지" 같은 대괄호 형식도 처리
        //   → "오후 3:30" 제거 후 "[] 이름 : 메시지" → "[", "]" 도 제거
        let messagePart = line.replace(PATTERNS.timePattern, '').trim();
        // 양 끝 [ ] 와 공백 제거 (예: "[]", " [ ", " ] ")
        messagePart = messagePart.replace(/^[\s\[\]]+/, '').replace(/[\s\[\]]+$/, '').trim();

        if (messagePart) {
          // 내 메시지 여부
          const isMy = result.isMyMessage ||
                       messagePart.includes('(You)') ||
                       messagePart.includes('나');

          const message = parseMessage(messagePart, isMy);

          if (message) {
            const timestamp = parseDateTime(result.currentDate, line);

            result.messages.push({
              ...message,
              timestamp: timestamp || new Date(),
              rawLine: line,
            });

            if (message.type === 'text') {
              result.participants.add(message.sender);
            }
          }
        }

        result.isMyMessage = false;
        continue;
      }

      // 메시지 행 처리 (이름 : 메시지 형식)
      const message = parseMessage(line, result.isMyMessage);
      if (message && message.type === 'text') {
        // 현재 날짜가 없으면 가장 최근 날짜 사용
        if (!result.currentDate) {
          result.currentDate = '날짜 없음';
        }

        const timestamp = parseDateTime(result.currentDate, '');

        result.messages.push({
          ...message,
          timestamp: timestamp || new Date(),
          rawLine: line,
        });

        result.participants.add(message.sender);
      }

    } catch (error) {
      result.errors.push({
        line: i + 1,
        content: line.substring(0, 100),
        error: error.message,
      });
    }
  }

  // 날짜 범위 계산
  if (result.messages.length > 0) {
    const timestamps = result.messages
      .filter(m => m.timestamp instanceof Date)
      .map(m => m.timestamp.getTime());

    if (timestamps.length > 0) {
      result.dateRange.start = new Date(Math.min(...timestamps));
      result.dateRange.end = new Date(Math.max(...timestamps));
    }
  }

  // Set → Array 변환
  result.participants = Array.from(result.participants);

  return result;
}

/**
 * 다중 대화방 파싱
 * @param {string} content - 전체 파일 내용
 * @returns {Array} 대화방 목록
 */
export function parseMultipleChats(content) {
  // 대화방 구분선 패턴 (카카오톡 내보내기 형식)
  const separatorPattern = /={20,}/;

  const sections = content.split(separatorPattern);
  const chats = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // 대화방 이름 추출 (첫 줄)
    const firstLine = trimmed.split('\n')[0];
    const chatName = firstLine.replace(/[{}()\n]/g, '').trim();

    // 대화 내용 파싱
    const parsed = parseKakaoTalkFile(trimmed);

    if (parsed.messages.length > 0) {
      chats.push({
        name: chatName || '알 수 없음',
        ...parsed,
      });
    }
  }

  return chats;
}

/**
 * 대화 데이터 유효성 검사
 * @param {Object} chatData - 파싱된 대화 데이터
 * @returns {Object} 검사 결과
 */
export function validateChatData(chatData) {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // 메시지 수 검사
  if (chatData.messages.length === 0) {
    result.isValid = false;
    result.errors.push('대화가 없습니다');
    return result;
  }

  // 최소 메시지 수 검사
  if (chatData.messages.length < 3) {
    result.isValid = false;
    result.errors.push('메시지가 너무 적습니다. 분석하려면 최소 3개 이상의 메시지가 필요합니다.');
    return result;
  }

  // 참가자 수 검사
  if (chatData.participants.length < 2) {
    result.warnings.push('참가자가 1명뿐입니다. 1:1 대화가 아닌 것 같습니다.');
  }

  // 날짜 범위 검사
  if (!chatData.dateRange.start || !chatData.dateRange.end) {
    result.warnings.push('날짜 정보가 없습니다');
  }

  // 메시지 길이 검사
  const longMessages = chatData.messages.filter(m =>
    m.type === 'text' && m.content.length > 500
  );
  if (longMessages.length > 0) {
    result.warnings.push(`${longMessages.length}개의 긴 메시지가 있습니다`);
  }

  return result;
}

/**
 * 대화 데이터 내보내기
 * @param {Object} chatData - 파싱된 대화 데이터
 * @returns {string} JSON 문자열
 */
export function exportChatData(chatData) {
  return JSON.stringify(chatData, null, 2);
}

/**
 * 민감정보 마스킹
 * @param {Object} chatData - 파싱된 대화 데이터
 * @returns {Object} 마스킹된 대화 데이터
 */
export function maskSensitiveInfo(chatData) {
  const masked = JSON.parse(JSON.stringify(chatData));

  // 전화번호 패턴
  const phonePattern = /01[016789]-?\d{3,4}-?\d{4}/g;

  // 이메일 패턴
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  // 계좌번호 패턴
  const accountPattern = /\d{10,16}/g;

  const maskInfo = (text) => {
    if (typeof text !== 'string') return text;
    return text
      .replace(phonePattern, '[전화번호]')
      .replace(emailPattern, '[이메일]')
      .replace(accountPattern, '[계좌번호]');
  };

  // 메시지 내용 마스킹
  masked.messages = masked.messages.map(msg => ({
    ...msg,
    content: maskInfo(msg.content),
  }));

  return masked;
}

/**
 * 대화를 텍스트로 변환 (AI 분석용)
 * @param {Object} chatData - 파싱된 대화 데이터
 * @returns {string} AI 분석용 텍스트
 */
export function toAnalysisText(chatData) {
  // 민감정보 마스킹 적용
  const masked = maskSensitiveInfo(chatData);

  const lines = [];

  for (const msg of masked.messages) {
    if (msg.type !== 'text') continue;

    // 실제 이름 사용 (마스킹 후)
    const sender = msg.sender || (msg.isFromMe ? '나' : '상대방');
    const time = msg.timestamp instanceof Date
      ? msg.timestamp.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
      : '';

    lines.push(`[${time}] ${sender}: ${msg.content}`);
  }

  return lines.join('\n');
}

// ===== 테스트 코드는 별도 파일로 분리됨 (parser.test.js) =====
// RN 번들에서 import.meta 사용 불가하므로 직접 실행 테스트 제거
// `node src/kakaotalk-parser/parser.test.js` 로 테스트 실행 가능
