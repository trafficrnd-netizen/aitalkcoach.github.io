/**
 * AI 분석 엔진 - 프롬프트 정의
 *
 * 온디바이스 AI를 위한 최적화된 프롬프트
 */

// ===== 시스템 프롬프트 =====

/**
 * 메인 분석 시스템 프롬프트
 */
const ANALYSIS_SYSTEM_PROMPT = `당신은 20년 경력의 커플 상담사입니다.
한국인의 감정 표현과 대화 스타일을 깊이 이해하고 있습니다.
특히 데이트 대화, 연인과의 소통, 관계 상담에 전문적입니다.

분석时请注意以下几点:
1. 한국어의 반말/존댓말 구분과 그 의미
2. 이모티콘/이모지의 감정 표현 의미
3. 한국의 데이트 문화와 맥락
4. 말투에서 나타나는 관심도 표현
5. 암묵적 신호와 숨은 의미

답변은 반드시 JSON 형식으로 작성해주세요.`;

/**
 * 감정 분석용 프롬프트
 */
const EMOTION_ANALYSIS_PROMPT = `다음 대화의 감정/분위기를 분석해주세요.

대화:
{conversation}

분석 항목:
1. 상대방의 전체적인 감정/분위기
2. 감정의 변화 과정
3. 주요 감정 표현들

출력 형식 (JSON):
{
  "emotion": "긍정적|중립적|부정적|복합적",
  "emotion_score": 1-10,
  "emotion_emoji": "😊|😐|😢|😡|🥰|...",
  "description": "감정 설명 (2-3문장)",
  "emotion_changes": [
    {
      "point": "변화 지점",
      "from": "이전 감정",
      "to": "이후 감정"
    }
  ]
}`;

/**
 * 관심도 분석용 프롬프트
 */
const INTEREST_ANALYSIS_PROMPT = `상대방의 나에 대한 관심도를 분석해주세요.

대화:
{conversation}

분석 항목:
1. 관심도 수준 (높음/보통/낮음)
2. 관심도 판단 근거
3. 놓친 관심 신호
4. 걱정되는 신호

출력 형식 (JSON):
{
  "interest_level": "높음|보통|낮음",
  "interest_score": 1-10,
  "evidence": ["관심도 판단 근거 1", "관심도 판단 근거 2"],
  "missed_signals": ["놓친 신호 1", "놓친 신호 2"],
  "warning_signals": ["걱정되는 신호 1"],
  "advice": "추가 조언"
}`;

/**
 * 조언/피드백 분석용 프롬프트
 */
const ADVICE_ANALYSIS_PROMPT = `나의 대화 방식에서 개선점과 조언을해주세요.

대화:
{conversation}

분석 항목:
1. 내가 한 실수들
2. 나쁜 습관
3. 개선할 점
4. 특별히 좋았던 점

출력 형식 (JSON):
{
  "mistakes": [
    {
      "type": "실수 유형",
      "example": "구체적 예시",
      "why": "왜 문제인지",
      "improvement": "改善 방법"
    }
  ],
  "habits": ["나쁜 습관 1", "나쁜 습관 2"],
  "improvements": ["개선점 1", "개선점 2"],
  "strengths": ["좋았던 점 1", "좋았던 점 2"],
  "summary": "전체 요약"
}`;

/**
 * 답장 추천용 프롬프트
 */
const REPLY_SUGGESTION_PROMPT = `상대방의 마지막 메시지에 대한 답장 3가지를 추천해주세요.

대화:
{conversation}

요청:
- 자연스러운 한국인 대화 스타일
- 데이트/연인 관계에 적절한 톤
- 각 답장의 장단점 설명
- 구체적이고 바로 쓸 수 있는 답장

출력 형식 (JSON):
{
  "last_message": "마지막 메시지 요약",
  "suggestions": [
    {
      "reply": "추천 답장 1",
      "tone": "친근함|장난|진지|쿨",
      "pros": "장점",
      "cons": "단점",
      "best_for": "어떤 상황에 좋을지"
    },
    {
      "reply": "추천 답장 2",
      "tone": "친근함|장난|진지|쿨",
      "pros": "장점",
      "cons": "단점",
      "best_for": "어떤 상황에 좋을지"
    },
    {
      "reply": "추천 답장 3",
      "tone": "친근함|장난|진지|쿨",
      "pros": "장점",
      "cons": "단점",
      "best_for": "어떤 상황에 좋을지"
    }
  ],
  "avoid": ["피해야 할 답장 1", "피해야 할 답장 2"]
}`;

/**
 * 종합 분석용 프롬프트
 */
const COMPREHENSIVE_ANALYSIS_PROMPT = `대화를 종합적으로 분석해주세요.

대화:
{conversation}

출력 형식 (JSON):
{
  "summary": {
    "overview": "전체 대화 요약 (3-5문장)",
    "duration": "대화 기간",
    "message_count": "총 메시지 수"
  },
  "emotion": {
    "overall": "전체 감정",
    "emoji": "😊|😐|😢",
    "description": "감정 설명"
  },
  "interest": {
    "level": "높음|보통|낮음",
    "score": 1-10,
    "evidence": ["근거 1", "근거 2"]
  },
  "analysis": {
    "my_mistakes": ["내 실수 1", "내 실수 2"],
    "good_points": ["좋았던 점 1"],
    "missed_signals": ["놓친 신호"]
  },
  "suggestions": {
    "best_replies": [
      {
        "reply": "추천 답장",
        "tone": "톤"
      }
    ],
    "next_action": "다음에 어떻게 행동하면 좋을지"
  }
}`;

/**
 * 프롬프트 빌더 함수들
 */
function buildEmotionPrompt(conversation) {
  return EMOTION_ANALYSIS_PROMPT.replace('{conversation}', conversation);
}

function buildInterestPrompt(conversation) {
  return INTEREST_ANALYSIS_PROMPT.replace('{conversation}', conversation);
}

function buildAdvicePrompt(conversation) {
  return ADVICE_ANALYSIS_PROMPT.replace('{conversation}', conversation);
}

function buildReplyPrompt(conversation) {
  return REPLY_SUGGESTION_PROMPT.replace('{conversation}', conversation);
}

function buildComprehensivePrompt(conversation) {
  return COMPREHENSIVE_ANALYSIS_PROMPT.replace('{conversation}', conversation);
}

/**
 * Full analysis용 프롬프트 조합
 */
function buildFullAnalysisPrompts(conversation) {
  return {
    system: ANALYSIS_SYSTEM_PROMPT,
    emotion: buildEmotionPrompt(conversation),
    interest: buildInterestPrompt(conversation),
    advice: buildAdvicePrompt(conversation),
    replies: buildReplyPrompt(conversation),
    comprehensive: buildComprehensivePrompt(conversation),
  };
}

// ===== 응답 파싱 =====

/**
 * JSON 응답 파싱 (에러 핸들링 포함)
 */
function parseJSONResponse(responseText) {
  try {
    // 코드 블록 제거
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```json\s*/i, '').replace(/```\s*$/, '');
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
      const endIndex = cleaned.lastIndexOf('```');
      if (endIndex !== -1) {
        cleaned = cleaned.slice(0, endIndex);
      }
    }

    // JSON 파싱 시도
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON 파싱 실패:', error.message);
    console.error('원본 응답:', responseText.substring(0, 500));
    return null;
  }
}

/**
 * 응답 검증
 */
function validateAnalysisResponse(response, type) {
  const validTypes = [
    'emotion',
    'interest',
    'advice',
    'replies',
    'comprehensive'
  ];

  if (!validTypes.includes(type)) {
    return { isValid: false, error: 'Invalid analysis type' };
  }

  if (!response) {
    return { isValid: false, error: 'Empty response' };
  }

  // 각 타입별 필수 필드 검증
  const requiredFields = {
    emotion: ['emotion', 'emotion_score', 'emotion_emoji'],
    interest: ['interest_level', 'interest_score'],
    advice: ['mistakes', 'improvements'],
    replies: ['suggestions'],
    comprehensive: ['summary', 'emotion', 'interest']
  };

  const missing = requiredFields[type].filter(
    field => !(field in response)
  );

  if (missing.length > 0) {
    return {
      isValid: false,
      error: `Missing fields: ${missing.join(', ')}`
    };
  }

  return { isValid: true };
}

// ===== 내보내기 (ESM) =====

export {
  // 프롬프트
  ANALYSIS_SYSTEM_PROMPT,
  EMOTION_ANALYSIS_PROMPT,
  INTEREST_ANALYSIS_PROMPT,
  ADVICE_ANALYSIS_PROMPT,
  REPLY_SUGGESTION_PROMPT,
  COMPREHENSIVE_ANALYSIS_PROMPT,

  // 빌더 함수
  buildEmotionPrompt,
  buildInterestPrompt,
  buildAdvicePrompt,
  buildReplyPrompt,
  buildComprehensivePrompt,
  buildFullAnalysisPrompts,

  // 유틸
  parseJSONResponse,
  validateAnalysisResponse,
};

// ===== 테스트 코드 =====
// RN Metro 환경 호환: import.meta / process.argv 둘 다 안전하게 처리
const isMainModule = typeof process !== 'undefined' &&
                      typeof process.argv !== 'undefined' &&
                      process.argv[1] != null &&
                      (process.argv[1].endsWith('prompts.js') ||
                       process.argv[1].endsWith('prompts'));
if (isMainModule) {
  console.log('=== Prompt Test ===');
  const testConversation = `
나: 안녕 오늘 뭐 해?
상대방: 안녕~ 그냥 집에서 쉬고 있어 ㅎㅎ
나: 나 오늘 일 끝났어. 술 한 잔 할까?
상대방: 좋은데? 어디 가자
`;

  const prompts = buildFullAnalysisPrompts(testConversation);
  console.log('System prompt (first 200):\n', prompts.system.substring(0, 200));
}
