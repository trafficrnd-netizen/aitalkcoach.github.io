/**
 * 온디바이스 AI 모델 인터페이스
 * 
 * Fine-tuned 모델과 통합:
 * 1. LoRA/QLoRA로 fine-tune된 모델 로드
 * 2. GGUF 형식으로 변환 (llama.cpp)
 * 3. 기기에서 실행 (MLX for iOS, MediaPipe for Android)
 * 
 * 또는 서버 API 연동 (빠른 출시용)
 */

import { parseJSONResponse, validateAnalysisResponse, buildFullAnalysisPrompts } from './prompts.js';
import { searchKnowledge } from './rag.js';

/**
 * 사용 가능한 AI 백엔드 타입
 */
export const AI_BACKENDS = {
  MOCK: 'mock',           // Mock 응답 (기본값)
  OPENAI: 'openai',       // OpenAI API (gpt-4o-mini)
  CLAUDE: 'claude',       // Anthropic Claude API
  ON_DEVICE: 'on_device', // 온디바이스 (fine-tuned 모델)
};

/**
 * AI 설정
 */
const AI_CONFIG = {
  backend: AI_BACKENDS.MOCK, // 개발중: MOCK
  
  // OpenAI 설정
  openai: {
    apiKey: null, // RevenueCat 또는 환경변수에서 로드
    model: 'gpt-4o-mini',
    baseURL: 'https://api.openai.com/v1',
    maxTokens: 2048,
    temperature: 0.7,
  },
  
  // Anthropic 설정
  claude: {
    apiKey: null,
    model: 'claude-3-haiku-20240307',
    maxTokens: 2048,
    temperature: 0.7,
  },
  
  // 온디바이스 모델 설정
  onDevice: {
    modelPath: null,     // Fine-tuned 모델 경로
    quantization: 'q4_k_m', // GGUF 양자화 방식
    contextSize: 8192,
    nGPU: 1,
    nThreads: 4,
  },
};

// ===== Mock AI (개발/데모용) =====

class MockAI {
  async generate(prompt, config = {}) {
    const text = prompt.toLowerCase();
    
    if (text.includes('감정') || text.includes('emotion')) {
      return JSON.stringify({
        emotion: '긍정적',
        emotion_score: 8,
        emotion_emoji: '😊',
        description: '전체적으로 밝고 즐거운 분위기입니다.',
        emotion_changes: [],
      });
    }
    
    if (text.includes('관심') || text.includes('interest')) {
      return JSON.stringify({
        interest_level: '높음',
        interest_score: 8,
        evidence: ['만나자고 함', '답장이 빠름'],
        missed_signals: [],
        warning_signals: [],
        advice: '좋은 신호입니다. 적극적으로 답장하세요.',
      });
    }
    
    if (text.includes('답장') || text.includes('reply')) {
      return JSON.stringify({
        last_message: '만나자고 제안',
        suggestions: [
          { reply: '응 좋아! 어디 갈까?', tone: '친근함', pros: '긍정적', cons: '조금 소극적', best_for: '빠른 반응' },
          { reply: 'ㅋㅋ 좋아~ 그럼 7시에?', tone: '장난', pros: '친근', cons: '핵심 스킵', best_for: '가벼운 분위기' },
          { reply: '좋아! 그럼 오늘 저녁에?', tone: '진지', pros: '주도적', cons: '부담', best_for: '진지한 관계' },
        ],
        avoid: ['응', 'ㅇ', '좋아'],
      });
    }
    
    // 기본 응답
    return JSON.stringify({
      summary: { overview: '긍정적인 대화입니다.', duration: '오늘', message_count: 6 },
      emotion: { overall: '긍정적', emoji: '😊', description: '밝고 즐거운 분위기' },
      interest: { level: '높음', score: 8, evidence: ['만나자고 함'] },
      analysis: { my_mistakes: [], good_points: ['적극적으로 반응'], missed_signals: [] },
      suggestions: { best_replies: [{ reply: '응 좋아! 어디 갈까?', tone: '친근함' }], next_action: '만나기로 한 후 장소 정하기' },
    });
  }
}

// ===== OpenAI API =====

class OpenAIInterface {
  constructor(config) {
    this.config = config;
    this.model = config.model || 'gpt-4o-mini';
  }

  async generate(prompt, config = {}) {
    // 시스템 프롬프트 추출
    const systemMatch = prompt.match(/<\|start_header_id\|>system<\|end_header_id\|>([\s\S]*?)<\|eot_id\|>/);
    const systemPrompt = systemMatch ? systemMatch[1].trim() : '당신은 20년 경력의 커플 상담사입니다.';
    
    // 사용자 프롬프트 추출
    const userMatch = prompt.match(/<\|start_header_id\|>user<\|end_header_id\|>([\s\S]*?)<\|eot_id\|><\|start_header_id\|>assistant<\|end_header_id\|>/);
    const userPrompt = userMatch ? userMatch[1].trim() : prompt;
    
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: config.maxTokens || this.config.maxTokens,
        temperature: config.temperature || this.config.temperature,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

// ===== Anthropic Claude =====

class ClaudeInterface {
  constructor(config) {
    this.config = config;
    this.model = config.model || 'claude-3-haiku-20240307';
  }

  async generate(prompt, config = {}) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: config.maxTokens || this.config.maxTokens,
        messages: [{ role: 'user', content: prompt }],
        system: '당신은 20년 경력의 커플 상담사입니다. 응답은 반드시 JSON 형식으로 작성해주세요.',
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }
}

// ===== 온디바이스 모델 (Fine-tuned) =====

class OnDeviceModel {
  constructor(config) {
    this.config = config;
    this.model = null;
    this.tokenizer = null;
    this.isLoaded = false;
  }

  async load() {
    // Android: MediaPipe LLM Inference
    // iOS: MLX (Apple Silicon)
    
    // 예시 (실제 구현 시):
    // if (Platform.OS === 'android') {
    //   const { LLMInference } = await import('@aspect-ai/android-llm-inference');
    //   this.model = await LLMInference.fromModel({
    //     model: this.config.modelPath,
    //     quantization: this.config.quantization,
    //   });
    // } else if (Platform.OS === 'ios') {
    //   const { MLXLlm } = await import('mlx-llm');
    //   this.model = await MLXLlm.load(this.config.modelPath);
    // }
    
    console.log('On-device model loading:', this.config.modelPath);
    this.isLoaded = true;
  }

  async generate(prompt, config = {}) {
    if (!this.isLoaded) {
      await this.load();
    }

    // 예시 구현 (실제에서는 모델의 generate 메서드 사용)
    // const result = await this.model.generate({
    //   prompt: prompt,
    //   maxTokens: config.maxTokens || 2048,
    //   temperature: config.temperature || 0.7,
    //   stopStrings: ['<|eot_id|>'],
    // });
    // return result.response;

    // 임시: Mock 응답
    const mock = new MockAI();
    return mock.generate(prompt, config);
  }

  async unload() {
    this.model = null;
    this.isLoaded = false;
  }
}

// ===== AI 추상화 레이어 =====

class AIEngine {
  constructor(options = {}) {
    this.backend = options.backend || AI_CONFIG.backend;
    this.client = null;
    this.useRAG = options.useRAG !== false;
    
    this._initClient();
  }

  _initClient() {
    switch (this.backend) {
      case AI_BACKENDS.OPENAI:
        this.client = new OpenAIInterface(AI_CONFIG.openai);
        break;
      case AI_BACKENDS.CLAUDE:
        this.client = new ClaudeInterface(AI_CONFIG.claude);
        break;
      case AI_BACKENDS.ON_DEVICE:
        this.client = new OnDeviceModel(AI_CONFIG.onDevice);
        break;
      case AI_BACKENDS.MOCK:
      default:
        this.client = new MockAI();
        break;
    }
  }

  /**
   * API 키 설정 (동적으로 변경 가능)
   */
  setAPIKey(key, provider = 'openai') {
    if (provider === 'openai') {
      AI_CONFIG.openai.apiKey = key;
      this.backend = AI_BACKENDS.OPENAI;
    } else if (provider === 'claude') {
      AI_CONFIG.claude.apiKey = key;
      this.backend = AI_BACKENDS.CLAUDE;
    }
    this._initClient();
  }

  /**
   * 온디바이스 모델 경로 설정
   */
  setModelPath(path) {
    AI_CONFIG.onDevice.modelPath = path;
    this.backend = AI_BACKENDS.ON_DEVICE;
    this._initClient();
  }

  /**
   * 분석 실행
   */
  async analyze(conversation, options = {}) {
    const {
      types = ['emotion', 'interest', 'advice', 'replies'],
      useRAG = true,
    } = options;

    const results = {};
    const prompts = buildFullAnalysisPrompts(conversation);

    // RAG 컨텍스트
    let context = '';
    if (useRAG && this.useRAG) {
      const knowledge = searchKnowledge(conversation);
      if (knowledge.length > 0) {
        context = '\n\n[상담 지식베이스]:\n' +
          knowledge.map(k => `- ${k.category}: ${k.advice}`).join('\n');
      }
    }

    // 각 분석 타입별 실행
    for (const type of types) {
      try {
        let prompt = prompts[type];
        if (!prompt) continue;
        
        const fullPrompt = prompt + context;
        const responseText = await this.client.generate(fullPrompt, {
          maxTokens: 2048,
          temperature: 0.7,
        });

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

    return {
      success: true,
      results,
      backend: this.backend,
      timestamp: new Date().toISOString(),
    };
  }
}

// ===== Singleton export =====

let engineInstance = null;

export function getAIEngine(options = {}) {
  if (!engineInstance) {
    engineInstance = new AIEngine(options);
  }
  return engineInstance;
}

export function resetAIEngine() {
  engineInstance = null;
}

export { AIEngine, AI_BACKENDS, AI_CONFIG };
export default AIEngine;
