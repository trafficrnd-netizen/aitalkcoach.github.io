/**
 * AI 분석 엔진 - 메인 모듈
 *
 * 온디바이스 AI 모델을 활용한 대화 분석
 */

import { parseJSONResponse, validateAnalysisResponse, buildFullAnalysisPrompts } from './prompts.js';
import { searchKnowledge } from './rag.js';
import HeuristicAnalyzer from './heuristic.js';

/**
 * AI 모델 설정
 */
const MODEL_CONFIG = {
  // Gemma 2B (가벼운 사용)
  gemma: {
    name: 'gemma-2b-it',
    maxTokens: 2048,
    temperature: 0.7,
    contextWindow: 8192,
  },

  // Llama 3.2 3B (균형)
  llama: {
    name: 'llama-3.2-3b-instruct',
    maxTokens: 2048,
    temperature: 0.7,
    contextWindow: 128000,
  },

  // ChatGPT (서버 연동 시)
  chatgpt: {
    name: 'gpt-4o-mini',
    maxTokens: 2048,
    temperature: 0.7,
  },
};

/**
 * 분석 결과 타입
 */
const ANALYSIS_TYPES = {
  EMOTION: 'emotion',
  INTEREST: 'interest',
  ADVICE: 'advice',
  REPLIES: 'replies',
  COMPREHENSIVE: 'comprehensive',
};

/**
 * AI 모델 인터페이스 (플러그인 가능)
 */
class AIModelInterface {
  /**
   * @param {string} prompt - 프롬프트
   * @param {Object} config - 모델 설정
   * @returns {Promise<string>} AI 응답
   */
  async generate(prompt, config) {
    throw new Error('Not implemented');
  }
}

/**
 * 온디바이스 AI 실행 인터페이스
 */
class OnDeviceAI extends AIModelInterface {
  constructor() {
    super();
    this.model = null;
    this.isLoaded = false;
  }

  /**
   * 모델 로드
   */
  async loadModel(modelName = 'gemma-2b-it') {
    // 실제로는 MediaPipe LLM Inference 또는 MLX 사용
    // 예시 코드:
    //
    // Android (MediaPipe):
    // const { LLMInference } = require('@aspect-ai/android-llm-inference');
    // this.model = await LLMInference.fromModel({ model: modelName });
    //
    // iOS (MLX):
    // const { MLXLlm } = require('mlx-llm');
    // this.model = await MLXLlm.load(modelName);

    console.log(`모델 로드 중: ${modelName}`);
    this.isLoaded = true;
  }

  /**
   * 텍스트 생성
   */
  async generate(prompt, config = {}) {
    if (!this.isLoaded) {
      await this.loadModel();
    }

    // 실제 구현 시:
    // const result = await this.model.generate({
    //   prompt: prompt,
    //   maxTokens: config.maxTokens || 2048,
    //   temperature: config.temperature || 0.7,
    // });
    // return result.response;

    // 테스트용 더미 응답
    return this._generateDummyResponse(prompt);
  }

  /**
   * 테스트용 더미 응답 생성
   */
  _generateDummyResponse(prompt) {
    if (prompt.includes('감정') || prompt.includes('emotion')) {
      return JSON.stringify({
        emotion: '긍정적',
        emotion_score: 8,
        emotion_emoji: '😊',
        description: '전체적으로 밝고 즐거운 분위기입니다.',
        emotion_changes: [],
      });
    }

    if (prompt.includes('관심') || prompt.includes('interest')) {
      return JSON.stringify({
        interest_level: '높음',
        interest_score: 8,
        evidence: ['질문을 자주 함', '만나자고 제안함'],
        missed_signals: ['일정에 대한 구체적 언급 없음'],
        warning_signals: [],
        advice: '좋은 신호입니다.積極的に返事しましょう.',
      });
    }

    if (prompt.includes('답장') || prompt.includes('reply')) {
      return JSON.stringify({
        last_message: '술 한 잔 하자고 제안',
        suggestions: [
          {
            reply: '응 좋아! 어디 갈까?',
            tone: '친근함',
            pros: '긍정적이고 바로同意',
            cons: '조금 소극적',
            best_for: '신속한 반응이 중요할 때',
          },
          {
            reply: 'ㅋㅋ 좋아~ 그럼 7시에 만날까?',
            tone: '장난',
            pros: '친근하고 분위기 있음',
            cons: '호감도는 높지만 핵심 스킵',
            best_for: '가벼운 분위기일 때',
          },
          {
            reply: '좋아! 편의점 말고 조금 더 좋은 데 갈까?',
            tone: '진지',
            pros: '연락에 진지하게 대응',
            cons: '상대방이 부담 느낄 수 있음',
            best_for: '장기 관계를 원할 때',
          },
        ],
        avoid: ['응', 'ㅇ', '좋아'],
      });
    }

    // 기본 응답
    return JSON.stringify({
      summary: {
        overview: '전체적으로 긍정적인 대화입니다.',
        duration: '오늘',
        message_count: 6,
      },
      emotion: {
        overall: '긍정적',
        emoji: '😊',
        description: '밝고 즐거운 분위기',
      },
      interest: {
        level: '높음',
        score: 8,
        evidence: ['만나자고 함', '이모티콘 사용'],
      },
      analysis: {
        my_mistakes: ['답장이 조금 늦음'],
        good_points: ['술 마자고 먼저 제안함'],
        missed_signals: [],
      },
      suggestions: {
        best_replies: [{ reply: '응 좋아! 어디 갈까?', tone: '친근함' }],
        next_action: '만나기로 한 후에 구체적인 장소 정하기',
      },
    });
  }

  /**
   * 모델 언로드
   */
  async unloadModel() {
    this.model = null;
    this.isLoaded = false;
  }
}

/**
 * ChatGPT API 인터페이스 (백업용)
 */
class ChatGPTInterface extends AIModelInterface {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.model = MODEL_CONFIG.chatgpt;
  }

  async generate(prompt, config = {}) {
    // 실제로는 OpenAI API 호출
    // const { OpenAI } = require('openai');
    // const client = new OpenAI({ apiKey: this.apiKey });
    //
    // const response = await client.chat.completions.create({
    //   model: 'gpt-4o-mini',
    //   messages: [{ role: 'user', content: prompt }],
    //   max_tokens: 2048,
    //   temperature: 0.7,
    // });
    //
    // return response.choices[0].message.content;

    console.log('ChatGPT API 호출 (테스트 모드)');
    return OnDeviceAI.prototype._generateDummyResponse.call({}, prompt);
  }
}

/**
 * 분석기 클래스
 */
class ConversationAnalyzer {
  constructor(options = {}) {
    this.ai = options.ai || new OnDeviceAI();
    this.useRAG = options.useRAG !== false;
    // 휴리스틱 모드: ai가 HeuristicAnalyzer면 useHeuristic=true.
    // LLM/OpenAI 사용 시 명시적으로 useHeuristic=false 옵션 전달.
    this.useHeuristic = options.useHeuristic !== false && this.ai instanceof HeuristicAnalyzer;
    this.conversation = '';
  }

  /**
   * 대화 설정
   */
  setConversation(conversation) {
    this.conversation = conversation;
    // 휴리스틱 분석기는 자체적으로 메시지 파싱을 수행하므로 위임
    if (this.useHeuristic && typeof this.ai.setConversation === 'function') {
      this.ai.setConversation(conversation);
    }
  }

  /**
   * 종합 분석 실행
   */
  async analyze(options = {}) {
    const {
      types = [
        ANALYSIS_TYPES.EMOTION,
        ANALYSIS_TYPES.INTEREST,
        ANALYSIS_TYPES.ADVICE,
        ANALYSIS_TYPES.REPLIES,
      ],
      useRAG = true,
    } = options;

    // 휴리스틱 모드: HeuristicAnalyzer에 직접 위임 (실제 메시지 분석 + 메시지별 코멘트)
    if (this.useHeuristic) {
      try {
        const heuristicResult = await this.ai.analyze({ types });
        return heuristicResult;
      } catch (e) {
        console.warn('[ConversationAnalyzer] heuristic 분석 실패, fallback:', e?.message);
        // 실패해도 아래 LLM fallback으로 계속 진행
      }
    }

    const results = {};
    const prompts = buildFullAnalysisPrompts(this.conversation);

    // RAG 관련 지식 추가
    let context = '';
    if (useRAG && this.useRAG) {
      const knowledge = searchKnowledge(this.conversation);
      if (knowledge.length > 0) {
        context = '\n\n[참고 지식베이스]:\n' +
          knowledge.map(k => `- ${k.category}: ${k.advice}`).join('\n');
      }
    }

        // 각 분석 타입별 실행
        for (const type of types) {
          try {
            let prompt;
            switch (type) {
              case ANALYSIS_TYPES.EMOTION:
                prompt = prompts.emotion;
                break;
              case ANALYSIS_TYPES.INTEREST:
                prompt = prompts.interest;
                break;
              case ANALYSIS_TYPES.ADVICE:
                prompt = prompts.advice;
                break;
              case ANALYSIS_TYPES.REPLIES:
                prompt = prompts.replies;
                break;
              case ANALYSIS_TYPES.COMPREHENSIVE:
                prompt = prompts.comprehensive;
                break;
              // [ASSUMPTION] 업무분석/빠른 조언은 휴리스틱 경로에서 처리됨.
              //              LLM 경로로 들어올 일 없으므로 default: continue 로 폴백.
              case 'work_summary':
              case 'work_integrated':
              case 'work_actions':
              case 'quick_advice':
                continue;
              default:
                continue;
            }

        // RAG 컨텍스트 추가
        const fullPrompt = prompt + context;

        // AI 호출
        const responseText = await this.ai.generate(fullPrompt, {
          maxTokens: 2048,
          temperature: 0.7,
        });

        // 응답 파싱
        const parsed = parseJSONResponse(responseText);
        const validation = validateAnalysisResponse(parsed, type);

        if (validation.isValid) {
          results[type] = parsed;
        } else {
          console.warn(`${type} 분석 실패:`, validation.error);
          results[type] = null;
        }
      } catch (error) {
        console.error(`${type} 분석 중 에러:`, error);
        results[type] = null;
      }
    }

    // 종합 분석 추가
    try {
      const comprehensivePrompt = prompts.comprehensive + context;
      const responseText = await this.ai.generate(comprehensivePrompt, {
        maxTokens: 2048,
        temperature: 0.7,
      });
      const parsed = parseJSONResponse(responseText);
      if (parsed) {
        results.comprehensive = parsed;
      }
    } catch (error) {
      console.error('종합 분석 실패:', error);
    }

    return {
      success: true,
      results,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 감정 분석만
   */
  async analyzeEmotion() {
    return this.analyze({ types: [ANALYSIS_TYPES.EMOTION] });
  }

  /**
   * 관심도 분석만
   */
  async analyzeInterest() {
    return this.analyze({ types: [ANALYSIS_TYPES.INTEREST] });
  }

  /**
   * 답장 추천만
   */
  async getReplySuggestions() {
    return this.analyze({ types: [ANALYSIS_TYPES.REPLIES] });
  }
}

/**
 * 분석기 팩토리
 *
 * 기본: HeuristicAnalyzer (메시지 기반 휴리스틱 분석 — 즉시 동작, API 키 불필요).
 *      진짜 LLM 호출이 필요하면 옵션으로 useHeuristic=false, useLLM=true, apiKey=... 전달.
 */
function createAnalyzer(options = {}) {
  const {
    useOnDevice = true,   // 하위 호환
    useHeuristic = true,  // 휴리스틱 분석기 사용 (기본)
    useLLM = false,       // 명시적 LLM 사용
    apiKey = null,
  } = options;

  let ai;
  if (useLLM && apiKey) {
    ai = new ChatGPTInterface(apiKey);
  } else if (!useHeuristic && useOnDevice) {
    // 명시적으로 휴리스틱 끄고 온디바이스 LLM 요청 → 아직 실제 모델 없으므로 OnDeviceAI dummy
    ai = new OnDeviceAI();
  } else {
    // 기본: 휴리스틱 (실제 메시지 분석)
    ai = new HeuristicAnalyzer();
  }

  return new ConversationAnalyzer({ ai, useHeuristic });
}

// ===== 모듈 내보내기 =====

export {
  // 클래스
  AIModelInterface,
  OnDeviceAI,
  ChatGPTInterface,
  ConversationAnalyzer,

  // 함수
  createAnalyzer,
  MODEL_CONFIG,
  ANALYSIS_TYPES,
};

// ===== 테스트 코드 =====
// RN Metro 환경 호환: import.meta / process.argv 둘 다 안전하게 처리
const isMainModule = typeof process !== 'undefined' &&
                      typeof process.argv !== 'undefined' &&
                      process.argv[1] != null &&
                      (process.argv[1].endsWith('analyzer.js') ||
                       process.argv[1].endsWith('analyzer'));
if (isMainModule) {
  (async () => {
    console.log('=== AI Engine Test ===\n');

    const analyzer = createAnalyzer();

    const testConversation = `
나: 안녕 오늘 뭐 해?
상대방: 안녕~ 그냥 집에서 쉬고 있어 ㅎㅎ
나: 나 오늘 일 끝났어. 술 한 잔 할까?
상대방: 좋은데? 어디 가자
나: 그럼 네 집 앞 편의점으로 7시에?
상대방: 응 좋아!
`;

    analyzer.setConversation(testConversation);

    console.log('Running analysis...\n');
    const result = await analyzer.analyze();

    console.log('Result:');
    console.log(JSON.stringify(result, null, 2));
  })().catch(console.error);
}
