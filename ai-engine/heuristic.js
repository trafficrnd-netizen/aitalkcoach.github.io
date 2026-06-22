/**
 * AI 분석 엔진 - 휴리스틱 분석기
 *
 * LLM API 없이 디바이스에서 실제 카카오톡 메시지를 분석.
 * - 한국어 감정/관심 키워드 매칭
 * - 메시지별 시그널 추출 (관심 표현, 질문, 사과, 약속 등)
 * - 메시지별 코멘트 + 종합 분석
 *
 * 장점:
 * - 실제 대화 내용을 반영한 분석 (LLM dummy response와 다름)
 * - API 키 / 네트워크 불필요
 * - 즉시 동작 (메시지 100개 < 100ms)
 * - 메시지별 직접 분석 가능
 *
 * 한계:
 * - 키워드 기반이라 뉘앙스/맥락 이해는 LLM보다 떨어짐
 * - 새로운 표현은 사전에 추가해야 함
 */

import { parseKakaoTalkFile } from '../kakaotalk-parser/parser.js';

// ============================================================
// 한국어 감정 / 시그널 키워드 사전
// ============================================================

/** 긍정 감정 키워드 (가중치: 높을수록 강한 긍정) */
const POSITIVE_KEYWORDS = {
  // 강한 긍정
  strong: [
    '사랑해', '좋아해', '최고야', '최고다', '대박', '완벽', '완벽해', '꿈같아',
    '감동', '감동이야', '감동이네', '벅차', '벅차오', '고마워요', '감사해요',
    '보고 싶어', '보고싶어', '보고 싶었', '보고싶었', '보고 시퍼',
  ],
  // 보통 긍정
  normal: [
    '좋아', '좋고', '좋다', '좋네', '좋아서', '기분 좋아', '기분이 좋아',
    'ㅎㅎ', 'ㅋㅋ', 'ㅎㅅㅎ', 'ㅎㅇㅎ', '^^', '^_^', '😊', '😄', '😁', '🥰',
    '♥', '♡', '❤', '❤️', '💕', '💖',
    '행복', '행복해', '기쁨', '기뻐', '즐거', '즐거워', '신나', '신나아',
    '설레', '설레어', '설렌다', '기대', '기대돼', '기대되',
    '잘했어', '잘했네', '잘해', '잘하잖아', '멋져', '멋지다', '멋있어',
    '예뻐', '이뻐', '예쁘다', '이쁘다', '귀여워', '귀엽다', '귀엽네',
    '다행', '다행이야', '다행이다', '안심', '편안', '편안해',
    '고마워', '고맙', '감사', '감사합니다', '땡큐', 'ㅎㅇ',
    '오 좋', '오 대박', '오 좋다', '오 감사', '오 좋아',
  ],
  // 약한 긍정
  weak: [
    'ㅎㅇ', 'ㅎㅎ', 'ㅋㅋ', 'ㅎ', 'ㅋ', '네~', '넹', '넵', 'ㅇㅋ',
    '오케이', 'ok', 'okay', 'good', '굿', '굿굿', 'ㅇㅇ', '응~',
  ],
};

/** 부정 감정 키워드 */
const NEGATIVE_KEYWORDS = {
  strong: [
    '미안해', '미안하다', '미안해요', '죄송', '죄송해', '죄송합니다',
    '싫어', '싫다', '싫어해', '화나', '짜증나', '짜증나게', '짜증난',
    '슬퍼', '슬프다', '우울해', '우울하다', '힘들어', '힘들다',
    '지쳤어', '지쳤다', '지치겠', '바빠', '바쁘다',
  ],
  normal: [
    'ㅠㅠ', 'ㅜㅜ', 'ㅠ', 'ㅜ', '😭', '😢', '😞', '😔', '😟',
    '아쉬', '아쉽다', '안돼', '안 되', '안되네', '별로', '별로야',
    '시러', '시러요', '힘들', '힘든', '지침', '지쳐',
    '어떡해', '어떡하지', '어쩌지', '어쩌면', '걱정', '걱정돼',
    '무섭', '무서워', '불안', '불안해',
  ],
  weak: [
    '흠', '음', '...', '..', '…', '에휴', '에이', '아',
    'ㅇㅇ', 'ㄴㄴ', 'ㄴㄴㄴ', '아닌데', '아닌가',
  ],
};

/** 관심 시그널 패턴 */
const INTEREST_SIGNALS = {
  // 질문 (관심 표현)
  question: ['?', '뭐', '왜', '어떻게', '언제', '어디', '누구', '몇 시', '뭐해', '뭐하', '뭐함', '뭐하니', '잘 지내', '잘 지내지', '잘 지내고', '어디야', '언제 와', '왜 안', '왜 안와', '왜 안 와'],
  // 만남 제안
  meetup: ['만나', '보자', '같이', '함께', '가자', '갈까', '갈래', '할까', '하자', '하자고', '만남', '데이트', '술 먹', '술 마시', '밥 먹', '밥 먹자', '커피', '영화', '뭐 먹', '뭐 먹을', '뭐 먹을까'],
  // 이모티콘 (친근함)
  emoji: ['ㅎㅎ', 'ㅋㅋ', 'ㅠㅠ', 'ㅜㅜ', 'ㅎㅅㅎ', 'ㅎㅇㅎ', 'ㅇㅅㅇ', 'ㅎㅇ', 'ㅋ', 'ㅠ', 'ㅜ', '^^', 'ㅡㅡ', 'ㅡ'],
  // 호감 표현
  affection: ['보고 싶', '보고싶', '보고 시퍼', '좋아해', '사랑해', '꿈같', '너무 좋아', '너무 좋', '너무예쁘', '너무 예쁘', '귀여워', '귀엽다', '멋져', '멋있다', '잘생겼', '예쁘다', '이쁘다'],
  // 감사/배려
  care: ['조심해', '밥 먹었', '밥 먹어', '잘 자', '잘자', '푹 쉬', '빨리 나아', '몸 관리', '감기', '건강해', '걱정되', '걱정돼서'],
};

/** 무관심 시그널 (부정적 신호) */
const DISINTEREST_SIGNALS = {
  shortReply: ['ㅇㅇ', '응', '네', 'ㄴㄴ', 'ㅇㅋ', 'ㅇ', 'ㄱㄱ', 'ㅇㅇㅇ', 'ㅇㅋㅇㅋ', '넵', '넹'],
  delay: ['아', '아 잠깐', '잠깐만', '바빠서', '바빠', '바쁨', '바쁘다', '나중에', '나중에 할게', '나중에 보자', '나중에 연락할게'],
  cold: ['별로', '그렇구나', '그렇군', '모르겠어', '글쎄', '몰라', 'ㅇㅇ', '넵'],
};

// ============================================================
// 휴리스틱 분석기 클래스
// ============================================================

class HeuristicAnalyzer {
  constructor() {
    this.messages = [];
    this.mySender = null;
    this.otherSender = null;
    this.stats = null;
  }

  /**
   * 대화 텍스트를 파싱해서 내부 상태 세팅
   */
  setConversation(text) {
    if (!text || typeof text !== 'string') {
      this.messages = [];
      return this;
    }

    const parsed = parseKakaoTalkFile(text);
    this.messages = parsed.messages.filter((m) => m.type === 'text');

    // 발신자 식별
    const senders = [...new Set(this.messages.map((m) => m.sender))];
    const meMsg = this.messages.find((m) => m.isFromMe);
    if (meMsg) {
      this.mySender = meMsg.sender;
      this.otherSender = senders.find((s) => s !== this.mySender) || '상대방';
    } else if (senders.length >= 2) {
      // isFromMe 플래그가 없는 경우, (You) 마커가 있거나 더 자주 보낸 사람 = 나
      const meMarker = senders.find((s) => /\(You\)/.test(s) || /나/.test(s));
      if (meMarker) {
        this.mySender = meMarker;
        this.otherSender = senders.find((s) => s !== meMarker);
      } else {
        // fallback: 첫 메시지 보낸 사람 = 상대, 더 많이 보낸 사람 = 나 (1:1 대화 가정)
        const counts = {};
        for (const m of this.messages) {
          counts[m.sender] = (counts[m.sender] || 0) + 1;
        }
        const sorted = senders.sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
        this.mySender = sorted[0];
        this.otherSender = sorted[1] || '상대방';
      }
    } else if (senders.length === 1) {
      this.otherSender = senders[0];
      this.mySender = '나';
    }

    return this;
  }

  isFromMe(msg) {
    if (msg.isFromMe) return true;
    if (this.mySender && msg.sender === this.mySender) return true;
    return false;
  }

  /**
   * 종합 분석 실행
   */
  async analyze(options = {}) {
    const types = options.types || ['emotion', 'interest', 'advice', 'replies'];
    const results = {};

    if (this.messages.length === 0) {
      return {
        success: false,
        error: '분석할 메시지가 없습니다.',
        results: {},
        timestamp: new Date().toISOString(),
      };
    }

    // 사전 통계 계산
    this.stats = this.computeStats();

    // [FIX] 각 분석을 try-catch 로 감싸서 한 단계 실패가 전체 분석을 죽이지 않게.
    //       실패 시 빈 구조체로 fallback → UI에서 graceful empty state 가능.
    const safeRun = (name, fn, emptyResult) => {
      try {
        return fn();
      } catch (e) {
        console.warn(`[HeuristicAnalyzer] ${name} 실패:`, e?.message || e);
        return emptyResult;
      }
    };

    // 각 분석 실행
    if (types.includes('emotion')) results.emotion = safeRun('analyzeEmotion', () => this.analyzeEmotion(), null);
    if (types.includes('interest')) results.interest = safeRun('analyzeInterest', () => this.analyzeInterest(), null);
    if (types.includes('advice')) results.advice = safeRun('analyzeAdvice', () => this.analyzeAdvice(), null);
    if (types.includes('replies')) results.replies = safeRun('generateReplySuggestions', () => this.generateReplySuggestions(), null);

    // === 업무분석 모드 ===
    if (types.includes('work_summary')) results.work_summary = safeRun('analyzeWorkSummary', () => this.analyzeWorkSummary(), {
      summary: '대화 내용을 정리할 수 없어요.',
      key_points: [],
      decisions: [],
      open_questions: [],
      schedules: [],
      date_range: null,
      timeline: [],
    });
    if (types.includes('work_integrated')) results.work_integrated = safeRun('analyzeWorkIntegrated', () => this.analyzeWorkIntegrated(), {
      themes: [],
      theme_quotes: {},
      overall_tone: '',
      tone_evidence: '',
      collaboration_signals: [],
      risks: [],
      risk_quotes: {},
    });
    if (types.includes('work_actions')) results.work_actions = safeRun('analyzeWorkActions', () => this.analyzeWorkActions(), []);

    // === 빠른 조언 모드 ===
    if (types.includes('quick_advice')) {
      results.work_summary = safeRun('quick_work_summary', () => ({
        summary: this.messages.map(m => m.content).join(' ').slice(0, 400),
      }), { summary: '' });
      results.quick_advice = safeRun('analyzeQuickAdvice', () => this.analyzeQuickAdvice(), {
        headline: '한 줄 조언',
        advice: '조언을 만드는 중 문제가 생겼어요.',
        tone: 'neutral',
        emoji: '🤔',
      });
    }

    // 종합
    results.comprehensive = safeRun('buildComprehensive', () => this.buildComprehensive(results), null);

    // 메시지별 분석 (핵심)
    results.messageAnalysis = safeRun('analyzeMessages', () => this.analyzeMessages(), []);

    // 메타데이터
    results.meta = {
      totalMessages: this.messages.length,
      myMessages: this.messages.filter((m) => this.isFromMe(m)).length,
      otherMessages: this.messages.filter((m) => !this.isFromMe(m)).length,
      otherSender: this.otherSender,
      mySender: this.mySender,
    };

    return {
      success: true,
      results,
      timestamp: new Date().toISOString(),
      backend: 'heuristic',
    };
  }

  // ============================================================
  // 기본 통계
  // ============================================================

  computeStats() {
    const me = this.messages.filter((m) => this.isFromMe(m));
    const other = this.messages.filter((m) => !this.isFromMe(m));

    const meLen = me.map((m) => m.content.length);
    const otherLen = other.map((m) => m.content.length);

    return {
      total: this.messages.length,
      meCount: me.length,
      otherCount: other.length,
      meRatio: me.length / this.messages.length,
      otherRatio: other.length / this.messages.length,
      avgMeLen: meLen.length ? meLen.reduce((a, b) => a + b, 0) / meLen.length : 0,
      avgOtherLen: otherLen.length ? otherLen.reduce((a, b) => a + b, 0) / otherLen.length : 0,
    };
  }

  // ============================================================
  // 감정 분석
  // ============================================================

  analyzeEmotion() {
    const other = this.messages.filter((m) => !this.isFromMe(m));
    const me = this.messages.filter((m) => this.isFromMe(m));

    // 각 메시지 감정 점수 계산
    const scoreMessage = (content) => {
      let score = 5; // 중립 baseline
      let positiveHits = 0;
      let negativeHits = 0;

      for (const kw of POSITIVE_KEYWORDS.strong) {
        if (content.includes(kw)) {
          score += 2;
          positiveHits += 2;
        }
      }
      for (const kw of POSITIVE_KEYWORDS.normal) {
        if (content.includes(kw)) {
          score += 1;
          positiveHits += 1;
        }
      }
      for (const kw of POSITIVE_KEYWORDS.weak) {
        if (content.includes(kw)) {
          score += 0.3;
          positiveHits += 0.3;
        }
      }
      for (const kw of NEGATIVE_KEYWORDS.strong) {
        if (content.includes(kw)) {
          score -= 2;
          negativeHits += 2;
        }
      }
      for (const kw of NEGATIVE_KEYWORDS.normal) {
        if (content.includes(kw)) {
          score -= 1;
          negativeHits += 1;
        }
      }
      for (const kw of NEGATIVE_KEYWORDS.weak) {
        if (content.includes(kw)) {
          score -= 0.3;
          negativeHits += 0.3;
        }
      }

      // 1~10 클램프
      score = Math.max(1, Math.min(10, score));

      let emotion = '중립';
      if (score >= 7) emotion = '긍정적';
      else if (score <= 3) emotion = '부정적';
      else if (score >= 6) emotion = '밝음';
      else if (score <= 4) emotion = '차분';

      return {
        score,
        emotion,
        positiveHits,
        negativeHits,
        signals: this.detectSignals(content),
      };
    };

    // 상대방 메시지 분석 (상대방 감정이 더 중요)
    const otherScores = other.map((m) => scoreMessage(m.content));
    const meScores = me.map((m) => scoreMessage(m.content));

    const avgScore = (arr) => (arr.length ? arr.reduce((a, b) => a + b.score, 0) / arr.length : 5);
    const overallScore = avgScore(otherScores);
    const myScore = avgScore(meScores);

    let overall = '중립';
    let emoji = '😐';
    if (overallScore >= 7) {
      overall = '긍정적';
      emoji = '😊';
    } else if (overallScore >= 6) {
      overall = '밝음';
      emoji = '🙂';
    } else if (overallScore <= 3) {
      overall = '부정적';
      emoji = '😟';
    } else if (overallScore <= 4) {
      overall = '차분';
      emoji = '😶';
    }

    // 감정 타임라인 (대화 흐름)
    const timeline = otherScores.map((s, idx) => {
      const originalMsg = other[idx];
      return {
        emotion: s.emotion,
        period: `메시지 ${idx + 1}`,
        note: originalMsg.content.slice(0, 30) + (originalMsg.content.length > 30 ? '...' : ''),
      };
    });

    // 감정 변화 패턴
    let trend = '안정적';
    if (otherScores.length >= 3) {
      const first = otherScores.slice(0, Math.ceil(otherScores.length / 2))
        .reduce((a, b) => a + b.score, 0) / Math.ceil(otherScores.length / 2);
      const second = otherScores.slice(Math.ceil(otherScores.length / 2))
        .reduce((a, b) => a + b.score, 0) / Math.floor(otherScores.length / 2);
      if (second - first > 1) trend = '점점 밝아짐';
      else if (first - second > 1) trend = '점점 차분해짐';
    }

    return {
      overall,
      score: Math.round(overallScore * 10) / 10,
      emoji,
      description: this.describeEmotion(overallScore, this.stats, trend),
      timeline: timeline.slice(-5), // 최근 5개만
      breakdown: this.computeEmotionBreakdown(otherScores),
      myScore: Math.round(myScore * 10) / 10,
      trend,
      advice: this.emotionAdvice(overallScore, trend),
    };
  }

  describeEmotion(score, stats, trend) {
    let desc = '';
    if (score >= 7) {
      desc = `${this.otherSender || '상대방'}의 메시지가 전반적으로 밝고 긍정적입니다.`;
    } else if (score >= 5) {
      desc = `대화 분위기가 무난하고 편안합니다.`;
    } else if (score >= 3) {
      desc = `대화에서 다소 차분하거나 신중한 톤이 느껴집니다.`;
    } else {
      desc = `${this.otherSender || '상대방'}이 부정적이거나 피로해 보입니다. 신중하게 접근하세요.`;
    }
    desc += ` (${stats.otherCount}개 메시지 분석)`;
    if (trend === '점점 밝아짐') desc += ' 시간이 갈수록 더 밝아지고 있습니다.';
    else if (trend === '점점 차분해짐') desc += ' 대화 후반으로 갈수록 톤이 차분해지고 있습니다.';
    return desc;
  }

  computeEmotionBreakdown(otherScores) {
    if (otherScores.length === 0) {
      return { happiness: 5, sadness: 5, excitement: 5, calm: 5 };
    }
    const avg = (key) => {
      const v = otherScores.reduce((a, s) => a + (s[key] || 0), 0);
      return Math.min(10, Math.max(1, 5 + v));
    };
    return {
      happiness: Math.round(avg('positiveHits')),
      sadness: Math.round(avg('negativeHits') < 1 ? 8 : 5),
      excitement: Math.round(avg('positiveHits') * 0.7 + 3),
      calm: 5,
    };
  }

  emotionAdvice(score, trend) {
    if (score >= 7) return '대화 분위기가 좋습니다. 지금의 톤을 유지하세요.';
    if (score >= 5) return '자연스러운 대화입니다. 적극적으로 리액션을 보내보세요.';
    if (score >= 3) return '상대방이 조심스러운 듯합니다. 부담 없는 질문으로 대화를 이어가세요.';
    return '상대방이 불편해할 수 있습니다. 거리를 두거나 사과 메시지를 먼저 보내보세요.';
  }

  // ============================================================
  // 관심도 분석
  // ============================================================

  analyzeInterest() {
    const other = this.messages.filter((m) => !this.isFromMe(m));
    const me = this.messages.filter((m) => this.isFromMe(m));

    let score = 5; // 중립 시작
    const evidence = [];
    const missedSignals = [];

    // 1) 질문 수 (관심 표현)
    const otherQuestions = other.filter((m) => this.containsAny(m.content, INTEREST_SIGNALS.question)).length;
    const myQuestions = me.filter((m) => this.containsAny(m.content, INTEREST_SIGNALS.question)).length;
    if (otherQuestions > 0) {
      score += Math.min(2, otherQuestions * 0.5);
      evidence.push(`질문 ${otherQuestions}회 (대화를 이어가려는 의지)`);
    }

    // 2) 만남 제안
    const meetupCount = other.filter((m) => this.containsAny(m.content, INTEREST_SIGNALS.meetup)).length;
    if (meetupCount > 0) {
      score += 2;
      evidence.push(`만남/약속 관련 메시지 ${meetupCount}개`);
    }

    // 3) 이모티콘 사용
    const emojiCount = other.filter((m) => this.containsAny(m.content, INTEREST_SIGNALS.emoji)).length;
    const emojiRatio = emojiCount / Math.max(other.length, 1);
    if (emojiRatio > 0.5) {
      score += 1;
      evidence.push(`이모티콘 ${emojiCount}개 사용 (친근한 분위기)`);
    } else if (emojiRatio < 0.1 && other.length > 5) {
      score -= 1;
      missedSignals.push('이모티콘이 거의 없음 (다소 딱딱함)');
    }

    // 4) 호감 표현
    const affectionCount = other.filter((m) => this.containsAny(m.content, INTEREST_SIGNALS.affection)).length;
    if (affectionCount > 0) {
      score += 1.5;
      evidence.push(`호감 표현 ${affectionCount}회`);
    }

    // 5) 짧은 답장 빈도 (무관심 신호)
    const shortReplies = other.filter((m) => this.containsAny(m.content.trim(), DISINTEREST_SIGNALS.shortReply)).length;
    const shortRatio = shortReplies / Math.max(other.length, 1);
    if (shortRatio > 0.5) {
      score -= 2;
      evidence.push(`짧은 답장 ${shortReplies}개 (대화 적극성 저하)`);
    }

    // 6) 평균 메시지 길이 (관심 = 더 긴 메시지)
    if (this.stats.avgOtherLen > this.stats.avgMeLen * 1.5) {
      score += 1;
      evidence.push(`평균 메시지 길이: 상대방 ${Math.round(this.stats.avgOtherLen)}자 > 나 ${Math.round(this.stats.avgMeLen)}자`);
    } else if (this.stats.avgOtherLen < this.stats.avgMeLen * 0.5 && this.stats.avgMeLen > 5) {
      score -= 1;
      missedSignals.push(`상대방 메시지가 매우 짧음 (${Math.round(this.stats.avgOtherLen)}자)`);
    }

    // 7) 내가 너무 많이 보내고 있는지
    if (this.stats.meRatio > 0.7) {
      score -= 1;
      evidence.push(`내가 ${Math.round(this.stats.meRatio * 100)}% 메시지 전송 (비대칭)`);
    } else if (this.stats.otherRatio > 0.7) {
      score += 1;
      evidence.push(`상대방이 ${Math.round(this.stats.otherRatio * 100)}% 메시지 전송 (먼저 연락)`);
    }

    // 8) 첫 메시지 시작
    if (other.length > 0 && !this.isFromMe(other[0])) {
      score += 0.5;
      evidence.push('상대방이 대화 먼저 시작');
    }

    score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));

    let level = '보통';
    if (score >= 8) level = '매우 높음';
    else if (score >= 6) level = '높음';
    else if (score >= 4) level = '보통';
    else if (score >= 2) level = '낮음';
    else level = '매우 낮음';

    // 추천 행동
    let advice = '';
    if (score >= 7) {
      advice = '좋은 신호입니다. 자연스럽게 다음 만남을 제안해보세요.';
    } else if (score >= 5) {
      advice = '관심이 있지만 더 깊은 대화가 필요합니다. 공통 관심사를 물어보세요.';
    } else if (score >= 3) {
      advice = '관심이 약합니다. 부담을 줄이고 가벼운 안부만 보내보세요.';
    } else {
      advice = '지금은 한 발 물러나는 게 좋겠습니다. 상대방이 먼저 연락할 때까지 기다리세요.';
    }

    return {
      level,
      score,
      evidence,
      missedSignals,
      advice,
      indicators: this.buildIndicators(score, otherQuestions, meetupCount, emojiCount, shortReplies),
    };
  }

  buildIndicators(score, questions, meetups, emojis, shortReplies) {
    const safe = (v) => Math.min(10, Math.max(1, Math.round(v)));
    return [
      { type: 'question', name: '질문 빈도', value: safe(questions * 2 + 3), note: `${questions}회 질문` },
      { type: 'meetup', name: '만남 제안', value: safe(meetups * 3 + 2), note: `${meetups}회` },
      { type: 'emoji', name: '이모티콘', value: safe(emojis * 1.5 + 2), note: `${emojis}개` },
      { type: 'response', name: '응답 성실도', value: safe(score), note: score >= 5 ? '양호' : '개선 필요' },
    ];
  }

  // ============================================================
  // 조언 분석
  // ============================================================

  analyzeAdvice() {
    const me = this.messages.filter((m) => this.isFromMe(m));
    const other = this.messages.filter((m) => !this.isFromMe(m));

    const goodPoints = [];
    const improvements = [];

    // 1) 내 짧은 답장 비율
    const myShort = me.filter((m) => this.containsAny(m.content.trim(), DISINTEREST_SIGNALS.shortReply)).length;
    const myShortRatio = myShort / Math.max(me.length, 1);
    if (myShortRatio > 0.5) {
      improvements.push(`"응", "ㅇㅇ" 같은 짧은 답장이 ${myShort}개 (${Math.round(myShortRatio * 100)}%). 질문이나 의견으로 대화를 이어가세요.`);
    } else if (myShortRatio < 0.2 && me.length > 5) {
      goodPoints.push('적절한 길이로 답변하고 있어요.');
    }

    // 2) 내 메시지 비율
    if (this.stats.meRatio > 0.7) {
      improvements.push(`내가 ${Math.round(this.stats.meRatio * 100)}%를 보내고 있어요. 한 템포 쉬면서 상대방이 먼저 연락할 여유를 주세요.`);
    } else if (this.stats.meRatio < 0.3 && this.stats.total > 5) {
      goodPoints.push('상대방이 더 많이 연락하는 편이에요. 균형이 잘 맞습니다.');
    }

    // 3) 내 이모티콘
    const myEmojis = me.filter((m) => this.containsAny(m.content, INTEREST_SIGNALS.emoji)).length;
    const myEmojiRatio = myEmojis / Math.max(me.length, 1);
    if (myEmojiRatio === 0 && me.length > 3) {
      improvements.push('이모티콘이 전혀 없어요. ㅎㅎ, ㅋㅋ 정도만 추가해도 톤이 부드러워집니다.');
    } else if (myEmojiRatio > 0.5) {
      goodPoints.push('이모티콘으로 따뜻한 톤을 잘 만들고 있어요.');
    }

    // 4) 질문 비율 (관심 표현)
    const myQuestions = me.filter((m) => this.containsAny(m.content, INTEREST_SIGNALS.question)).length;
    if (myQuestions === 0 && me.length > 3) {
      improvements.push('질문이 전혀 없어요. "오늘 어땠어?", "뭐 했어?" 같은 가벼운 질문이 대화를 이어갑니다.');
    } else if (myQuestions > 0) {
      goodPoints.push(`질문 ${myQuestions}회로 대화를 잘 이끌고 있어요.`);
    }

    // 5) 사과 / 감사 표현
    const myApologies = me.filter((m) => this.containsAny(m.content, ['미안', '죄송', 'sorry'])).length;
    const myThanks = me.filter((m) => this.containsAny(m.content, ['고마워', '감사', '땡큐'])).length;
    if (myThanks > 0) goodPoints.push(`감사 표현 ${myThanks}회 (배려 있는 대화)`);

    // 6) 호감 표현
    const myAffection = me.filter((m) => this.containsAny(m.content, INTEREST_SIGNALS.affection)).length;
    if (myAffection === 0 && this.stats.otherCount > 5) {
      improvements.push('호감 표현이 거의 없어요. 가끔 직접적인 칭찬("오늘 뭐 했어? 잘 어울린다")이 효과적이에요.');
    } else if (myAffection > 0) {
      goodPoints.push('호감 표현을 자연스럽게 하고 있어요.');
    }

    // 종합 조언
    let summary = '';
    if (improvements.length === 0) {
      summary = '대화 스타일이 전반적으로 좋아요. 지금처럼 자연스럽게 이어가세요.';
    } else if (improvements.length <= 2) {
      summary = `${improvements[0].split('.')[0]}. ${improvements.length > 1 ? improvements[1].split('.')[0] + '.' : ''}`;
    } else {
      summary = `개선 포인트가 ${improvements.length}개 있습니다. 가장 중요한 것부터 하나씩 적용해보세요.`;
    }

    // 추천 행동
    const recommendations = [];
    if (improvements.length > 0) {
      recommendations.push({
        action: improvements[0].split('.')[0],
        reason: '대화 패턴 개선의 첫 단계로 효과적입니다.',
      });
    }
    if (goodPoints.length > 0) {
      recommendations.push({
        action: goodPoints[0],
        reason: '이미 잘하고 있는 부분입니다.',
      });
    }
    recommendations.push({
      action: '오늘 상대방의 메시지 톤에 맞춰 답변 톤 조절',
      reason: '대화 호흡이 더 자연스러워집니다.',
    });

    return {
      advice: summary,
      good_points: goodPoints,
      my_mistakes: improvements,
      analysis: {
        communication_style: this.summarizeStyle(),
        tone: {
          positive: goodPoints.slice(0, 3),
          negative: improvements.slice(0, 3),
        },
        relationship_stage: this.estimateStage(),
      },
      recommendations,
    };
  }

  summarizeStyle() {
    if (this.stats.avgMeLen > 30) return '길고 상세한 답변 스타일';
    if (this.stats.avgMeLen > 10) return '적당한 길이의 답변 스타일';
    return '짧고 간결한 답변 스타일';
  }

  estimateStage() {
    const meetupCount = this.messages.filter((m) =>
      this.containsAny(m.content, INTEREST_SIGNALS.meetup)
    ).length;
    const affectionCount = this.messages.filter((m) =>
      this.containsAny(m.content, INTEREST_SIGNALS.affection)
    ).length;

    if (affectionCount >= 3 || meetupCount >= 3) return '교제';
    if (meetupCount >= 1 || affectionCount >= 1) return '호감';
    if (this.stats.total > 10) return '친해지기';
    return '인사';
  }

  // ============================================================
  // 답장 추천
  // ============================================================

  generateReplySuggestions() {
    const other = this.messages.filter((m) => !this.isFromMe(m));
    if (other.length === 0) return { replies: [], default: [], last_message: '' };

    const last = other[other.length - 1];
    const lastContent = last.content;

    const replies = [];
    const lastSignals = this.detectSignals(lastContent);

    // 시그널에 따라 다른 톤 추천
    if (lastSignals.isQuestion) {
      // 질문 → 직접 답변
      replies.push({
        id: 'r-direct',
        text: this.answerFromContext(lastContent),
        tone: '진지',
        emoji: '💬',
        category: 'question',
        pros: '질문에 직접 답함',
        cons: '맥락 없이는 어색할 수 있음',
        best_for: '실제 답을 알고 있을 때',
      });
      replies.push({
        id: 'r-defer',
        text: '잠깐만 생각해볼게',
        tone: '쿨',
        emoji: '🤔',
        category: 'question',
        pros: '여유있게 답변',
        cons: '답이 늦어지면 호감도 ↓',
        best_for: '바로 답을 모를 때',
      });
      replies.push({
        id: 'r-curious',
        text: '왜 물어봐? 😊',
        tone: '장난',
        emoji: '😄',
        category: 'flirty',
        pros: '대화 이어가기',
        cons: '답을 회피',
        best_for: '장난스러운 분위기',
      });
    } else if (lastSignals.isMeetup) {
      // 만남 제안 → 수락/대안
      replies.push({
        id: 'r-accept',
        text: '좋아! 그럼 어디서 볼까?',
        tone: '친근함',
        emoji: '👍',
        category: 'meetup',
        pros: '적극적 수락',
        cons: '장소 결정 부담',
        best_for: '만남 확신 있을 때',
      });
      replies.push({
        id: 'r-time',
        text: '좋은데, 몇 시가 좋아?',
        tone: '실용',
        emoji: '🕐',
        category: 'meetup',
        pros: '구체적 시간 조율',
        cons: '장소 미정',
        best_for: '바쁜 일정 조율',
      });
      replies.push({
        id: 'r-alt',
        text: 'ㅋㅋ 좋아~ 그럼 [장소] 어때?',
        tone: '장난',
        emoji: '🤩',
        category: 'flirty',
        pros: '주도적으로 제안',
        cons: '상대 취향 모르면 리스크',
        best_for: '이미 잘 아는 사이',
      });
    } else if (lastSignals.hasAffection) {
      // 호감 표현 → 같이 표현
      replies.push({
        id: 'r-aff',
        text: '나도 보고 싶어 ㅎㅎ',
        tone: '다정',
        emoji: '🥰',
        category: 'affection',
        pros: '호감에 호감으로 응답',
        cons: '너무 직접적일 수 있음',
        best_for: '관계 진전 단계',
      });
      replies.push({
        id: 'r-aff-soft',
        text: 'ㅎㅎ 나도 너 좋아해',
        tone: '솔직',
        emoji: '😊',
        category: 'affection',
        pros: '진심 표현',
        cons: '단계 고려 필요',
        best_for: '확신 있을 때',
      });
      replies.push({
        id: 'r-aff-play',
        text: 'ㅋㅋ 갑자기 왜 이래 ㅎㅎ',
        tone: '쑥스러움',
        emoji: '😳',
        category: 'casual',
        pros: '귀여운 반응',
        cons: '쿨한 사람에게는 어색',
        best_for: '가벼운 분위기',
      });
    } else if (lastSignals.isShortReply) {
      // 짧은 답장 → 대화 이어가기
      replies.push({
        id: 'r-curious-q',
        text: '오늘 뭐 했어?',
        tone: '친근함',
        emoji: '❓',
        category: 'casual',
        pros: '대화 주제 던짐',
        cons: '구체성 ↓',
        best_for: '대화 끊겼을 때',
      });
      replies.push({
        id: 'r-share',
        text: '나는 오늘 [내 일] 했어. 너는?',
        tone: '공유',
        emoji: '📖',
        category: 'casual',
        pros: '대화 자연스럽게',
        cons: '먼저 말해야 함',
        best_for: '소통 활발한 사이',
      });
      replies.push({
        id: 'r-light',
        text: '심심하다 ㅋㅋ',
        tone: '장난',
        emoji: '🥱',
        category: 'casual',
        pros: '가벼운 톤',
        cons: '상대도 심심하면 음...',
        best_for: '친한 사이',
      });
    } else {
      // 일반 → 자연스러운 반응
      replies.push({
        id: 'r-react',
        text: 'ㅋㅋ 그렇구나',
        tone: '친근함',
        emoji: '😊',
        category: 'casual',
        pros: '자연스러운 리액션',
        cons: '대화 이어가기 어려움',
        best_for: '안전한 답변',
      });
      replies.push({
        id: 'r-engage',
        text: '오 진짜? 더 얘기해줘 ㅎㅎ',
        tone: '관심',
        emoji: '🤩',
        category: 'casual',
        pros: '관심 표현',
        cons: '상대 에너지 필요',
        best_for: '이야기 이어갈 때',
      });
      replies.push({
        id: 'r-relate',
        text: '나도 비슷한 경험 있어 ㅋㅋ',
        tone: '공감',
        emoji: '💬',
        category: 'casual',
        pros: '유대감 형성',
        cons: '실제 경험 없으면 어색',
        best_for: '공통 경험 있을 때',
      });
    }

    return {
      last_message: lastContent.slice(0, 50),
      suggestions: replies,
      default: replies.map((r) => r.text),
      categories: {
        casual: replies.filter((r) => r.category === 'casual').map((r) => r.text),
        question: replies.filter((r) => r.category === 'question').map((r) => r.text),
        flirty: replies.filter((r) => r.category === 'flirty').map((r) => r.text),
        meetup: replies.filter((r) => r.category === 'meetup').map((r) => r.text),
        affection: replies.filter((r) => r.category === 'affection').map((r) => r.text),
      },
      avoid: this.avoidPhrases(lastSignals),
    };
  }

  answerFromContext(q) {
    if (q.includes('뭐 했') || q.includes('뭐하')) return '오늘은 좀 쉬었어, 너는?';
    if (q.includes('언제')) return '이번 주말 어때?';
    if (q.includes('어디')) return 'OO 근처 어때?';
    if (q.includes('왜')) return '그냥 궁금해서 ㅎㅎ';
    if (q.includes('어떻게')) return '일단 해보자!';
    return '음... 잘 모르겠어 ㅎㅎ';
  }

  avoidPhrases(signals) {
    const avoid = [];
    if (!signals.isShortReply) {
      avoid.push('응', 'ㅇㅇ', '넵', 'ㄱㄱ', 'ㅋㅋ (혼자만)', '...');
    }
    if (!signals.isQuestion) {
      avoid.push('읽씹', '한참 뒤 답장', '답장 없이 잠수');
    }
    return avoid;
  }

  // ============================================================
  // 메시지별 분석 (핵심!)
  // ============================================================

  analyzeMessages() {
    return this.messages.map((msg, idx) => {
      const fromMe = this.isFromMe(msg);
      const content = msg.content;
      const signals = this.detectSignals(content);
      const emotionScore = this.scoreMessageSimple(content);
      const comment = this.generateMessageComment(msg, fromMe, signals, idx);

      return {
        index: idx,
        sender: msg.sender,
        isFromMe: fromMe,
        content,
        emotion: emotionScore,
        signals: signals.list,
        comment,
        emoji: signals.emoji,
      };
    });
  }

  generateMessageComment(msg, fromMe, signals, idx) {
    const comments = [];
    const c = msg.content;

    if (fromMe) {
      // 내 메시지에 대한 코멘트
      if (signals.isShortReply) {
        comments.push('짧은 답장 — 질문이나 의견으로 대화를 이어가면 더 좋아요.');
      }
      if (signals.hasAffection) {
        comments.push('호감 표현 — 진심이 담겨있네요.');
      }
      if (signals.isMeetup) {
        comments.push('만남 제안 — 적극적이고 좋은 시도입니다.');
      }
      if (c.length > 50 && signals.isQuestion) {
        comments.push('상세한 질문 — 상대방이 답변하기 좋은 형태입니다.');
      }
      if (c.length < 5 && !signals.isShortReply) {
        comments.push('한 단어 답장 — 의도가 분명할 때만 사용하세요.');
      }
    } else {
      // 상대방 메시지에 대한 코멘트
      if (signals.isQuestion) {
        comments.push('질문 — 대화를 이어가려는 의지가 보입니다.');
      }
      if (signals.hasAffection) {
        comments.push('호감 표현 — 관심 표현입니다.');
      }
      if (signals.isMeetup) {
        comments.push('만남 제안 — 관심의 강한 신호입니다.');
      }
      if (signals.isShortReply && c.length < 10) {
        comments.push('짧은 답장 — 바쁘거나 관심도가 낮을 수 있어요.');
      }
      if (signals.hasCare) {
        comments.push('배려 표현 — 당신을 걱정하고 있어요.');
      }
      if (signals.list.length === 0 && c.length > 20) {
        comments.push('일상 공유 — 편안한 관계의 신호입니다.');
      }
      if (idx === this.messages.length - 1) {
        comments.push('마지막 메시지 — 답장이 필요합니다.');
      }
    }

    if (comments.length === 0) {
      comments.push(fromMe ? '평범한 답변입니다.' : '일상적인 메시지입니다.');
    }

    return comments.join(' ');
  }

  scoreMessageSimple(content) {
    let score = 5;
    for (const kw of POSITIVE_KEYWORDS.strong) if (content.includes(kw)) score += 2;
    for (const kw of POSITIVE_KEYWORDS.normal) if (content.includes(kw)) score += 1;
    for (const kw of POSITIVE_KEYWORDS.weak) if (content.includes(kw)) score += 0.3;
    for (const kw of NEGATIVE_KEYWORDS.strong) if (content.includes(kw)) score -= 2;
    for (const kw of NEGATIVE_KEYWORDS.normal) if (content.includes(kw)) score -= 1;
    for (const kw of NEGATIVE_KEYWORDS.weak) if (content.includes(kw)) score -= 0.3;
    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }

  detectSignals(content) {
    const signals = {
      isQuestion: false,
      isMeetup: false,
      isShortReply: false,
      hasAffection: false,
      hasCare: false,
      emoji: '',
      list: [],
    };

    if (this.containsAny(content, INTEREST_SIGNALS.question)) {
      signals.isQuestion = true;
      signals.list.push('question');
    }
    if (this.containsAny(content, INTEREST_SIGNALS.meetup)) {
      signals.isMeetup = true;
      signals.list.push('meetup');
    }
    if (this.containsAny(content.trim(), DISINTEREST_SIGNALS.shortReply)) {
      signals.isShortReply = true;
      signals.list.push('short_reply');
    }
    if (this.containsAny(content, INTEREST_SIGNALS.affection)) {
      signals.hasAffection = true;
      signals.list.push('affection');
    }
    if (this.containsAny(content, INTEREST_SIGNALS.care)) {
      signals.hasCare = true;
      signals.list.push('care');
    }

    // 이모지 추출 (간단 버전)
    const emojiMatch = content.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
    if (emojiMatch) signals.emoji = emojiMatch[0];

    return signals;
  }

  containsAny(text, keywords) {
    if (!text || !keywords) return false;
    for (const k of keywords) {
      if (text.includes(k)) return true;
    }
    return false;
  }

  // ============================================================
  // 업무 분석 — 내용요약
  // ============================================================

  analyzeWorkSummary() {
    const allText = this.messages.map((m) => m.content).join(' ');

    // 핵심 포인트 추출
    const keyPoints = [];
    const decisions = [];
    const openQuestions = [];
    const schedules = [];
    let dateRange = null;

    // 시간/날짜 추출 정규식
    const timeRe = /(\d{1,2})시\s*(\d{1,2})?분?/;
    const dayRe = /(\d{1,2})일/;
    const weekDays = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
    const meetupWords = /회의|만남|미팅|면담|모임|일정|약속|만나|보자|가자|하자|모이자/;

    for (let i = 0; i < this.messages.length; i++) {
      const m = this.messages[i];
      const c = m.content.trim();
      if (!c) continue;

      // [우선순위 1] 미해결 질문
      if (/\?$/.test(c) || (/(언제|왜|어떻게|어디서|뭐|누가|얼마나|몇)/.test(c) && /\?/.test(c))) {
        openQuestions.push(c.length > 80 ? c.slice(0, 80) + '…' : c);
        continue;
      }
      // [우선순위 2] 결정/완료 표시
      if (/(했어|했음|했답|했습니다|완료|마감|배포|릴리즈|진행중|끝났|마쳤|예약|올렸|공유할게)/.test(c)) {
        decisions.push(c.length > 80 ? c.slice(0, 80) + '…' : c);
        continue;
      }
      // [우선순위 3] 일정/일정 조율 (날짜/시간/만남 키워드)
      const hasDate = dayRe.test(c) || weekDays.some((w) => c.includes(w)) || /\d{1,2}월/.test(c);
      const hasTime = timeRe.test(c) || /(오전|오후|낮|저녁|밤|새벽)/.test(c);
      if (hasDate || hasTime || meetupWords.test(c)) {
        const schedule = this.extractSchedule(c, m, hasDate, hasTime, meetupWords.test(c));
        if (schedule) {
          schedules.push(schedule);
        } else {
          // 일정 추출 실패해도 시간/날짜 언급이면 keyPoint에
          if (hasDate || hasTime) {
            keyPoints.push(c.length > 100 ? c.slice(0, 100) + '…' : c);
          }
        }
        continue;
      }
      // [우선순위 4] 일반 핵심 (URL/숫자/대문자 약어)
      if (/(http|www|\d+%|\d+원|API|DB|JIRA|Slack|노션|Notion|figma|Figma)/i.test(c)) {
        keyPoints.push(c.length > 100 ? c.slice(0, 100) + '…' : c);
      }
    }

    // 중복 제거
    const uniq = (arr) => Array.from(new Set(arr)).slice(0, 8);

    // 한 줄 요약
    let summary = '';
    if (this.messages.length > 0) {
      summary = `${this.stats.total}개의 메시지가 오갔어요. ` +
        (schedules.length > 0 ? `일정 ${schedules.length}건, ` : '') +
        (decisions.length > 0 ? `결정 ${decisions.length}건, ` : '') +
        (openQuestions.length > 0 ? `미해결 질문 ${openQuestions.length}건.` : '대화가 매끄럽게 진행됐어요.');
    }

    // 날짜 범위 계산
    if (schedules.length > 0) {
      const dates = schedules
        .map((s) => s.dateObj)
        .filter((d) => d instanceof Date && !isNaN(d.getTime()));
      if (dates.length > 0) {
        dateRange = {
          start: new Date(Math.min(...dates.map((d) => d.getTime()))).toLocaleDateString('ko-KR'),
          end: new Date(Math.max(...dates.map((d) => d.getTime()))).toLocaleDateString('ko-KR'),
        };
      }
    }

    return {
      summary,
      key_points: uniq(keyPoints),
      decisions: uniq(decisions),
      open_questions: uniq(openQuestions),
      schedules: schedules.slice(0, 8),
      date_range: dateRange,
      timeline: [],
    };
  }

  /**
   * 메시지에서 일정 정보 추출
   * @returns {Object|null} { type, title, time, location, participants, quote, from, dateObj }
   */
  extractSchedule(content, msg, hasDate, hasTime, isMeetup) {
    const trimmed = content.length > 150 ? content.slice(0, 150) + '…' : content;

    // 시간 추출
    let time = null;
    const ampmMatch = content.match(/(오전|오후|낮|저녁|밤|새벽)?\s*(\d{1,2})시\s*(\d{1,2})?분?/);
    if (ampmMatch) {
      time = ampmMatch[0].trim();
    } else {
      // HH:MM 형식
      const hmMatch = content.match(/\b(\d{1,2}):(\d{2})\b/);
      if (hmMatch) time = hmMatch[0];
    }

    // 날짜 추출
    let dateStr = null;
    let dateObj = null;
    const weekDays = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
    for (const w of weekDays) {
      if (content.includes(w)) {
        dateStr = w;
        // 다음 등장 요일 계산
        const today = new Date();
        const target = weekDays.indexOf(w);
        const current = (today.getDay() + 6) % 7; // 일요일=0 → 6으로 보정
        const diff = (target - current + 7) % 7;
        dateObj = new Date(today.getTime() + diff * 24 * 60 * 60 * 1000);
        break;
      }
    }
    if (!dateStr) {
      const dayMatch = content.match(/(\d{1,2})일/);
      const monthMatch = content.match(/(\d{1,2})월/);
      if (dayMatch) {
        dateStr = (monthMatch ? `${monthMatch[1]}월 ` : '') + `${dayMatch[1]}일`;
        // 올해/내년 추정
        const now = new Date();
        const month = monthMatch ? parseInt(monthMatch[1]) - 1 : now.getMonth();
        const day = parseInt(dayMatch[1]);
        dateObj = new Date(now.getFullYear(), month, day);
        if (dateObj < now) dateObj = new Date(now.getFullYear() + 1, month, day);
      } else if (monthMatch) {
        dateStr = `${monthMatch[1]}월`;
        dateObj = new Date(now.getFullYear(), parseInt(monthMatch[1]) - 1, 1);
      }
    }

    // 장소 추출
    let location = null;
    const placePatterns = [
      /(?:에서|로|으로)\s*([가-힣A-Za-z0-9\s]{2,20}?)(?:\s|$|에서|만나|보자|하자)/,
      /(회의실|카페|식당|집|사무실|본사|지사|스타벅스|투썸|맥도날드|버거|편의점|호텔|공항|역|학교|대학|도서관|병원|공원)/,
    ];
    for (const re of placePatterns) {
      const m = content.match(re);
      if (m) {
        location = m[1] || m[0];
        break;
      }
    }

    // 타입 결정
    let type = 'event';
    if (/(마감|deadline|까지|까지의)/i.test(content)) type = 'deadline';
    else if (/(회의|미팅|면담|보고|논의|브레인스토밍|스탠드업)/.test(content)) type = 'meeting';
    else if (/(여행|출장|비행|공항|호텔|체크인)/.test(content)) type = 'travel';
    else if (isMeetup) type = 'meeting';

    // [신규] 결정여부 — 메시지에서 일정 수락/거절/제안 신호 추출
    // - confirmed: 확정, ㅇㅋ, 좋아, 할게, 진행, ~함
    // - declined: 취소, 연기, 다음에, 안 돼
    // - pending: 미정, 보류, 고민, 어떨까, ?
    // - proposed: 질문/제안은 아니지만 명시적 확정 신호도 없음 (위 패턴 매칭 안 됨)
    const confirmedRe = /(확정|확정됐|확정임|ㅇㅋ|ㅇㅇ|ㄱㄱ|좋아|좋아요|좋겠|할게|할께|하자|갑시다|받았|진행|예약|됐어|됐네|다행|ㅋㅋㅋㅋ)/;
    const declinedRe = /(취소|취소해|연기|다음에|다음에 하|안 돼|안되|못하|패스|나갈게)/;
    const pendingRe = /(미정|보류|고민|생각중|생각 중|어떨까|어떤게|어떡하|아마|~|\?$)/;
    let decision = 'proposed';
    if (declinedRe.test(content)) decision = 'declined';
    else if (confirmedRe.test(content)) decision = 'confirmed';
    else if (pendingRe.test(content)) decision = 'pending';
    // 질문형(물음표)인데 확정 신호도 없으면 pending이 더 적절
    if (decision === 'proposed' && /\?/.test(content)) decision = 'pending';

    // 제목
    let title = content;
    if (location) title = title.replace(location, '').replace(/에서|으로|로/g, '').trim();
    if (time) title = title.replace(time, '').trim();
    if (dateStr) title = title.replace(dateStr, '').trim();
    title = title.replace(/[:\-,]/g, ' ').replace(/\s+/g, ' ').trim();
    if (title.length > 60) title = title.slice(0, 60) + '…';
    if (!title || title.length < 3) title = '일정';

    return {
      type,
      title,
      time,
      date: dateStr,
      dateObj,
      location,
      decision,
      participants: msg.isFromMe ? [] : [msg.sender].filter(Boolean),
      quote: trimmed,
      from: msg.sender,
    };
  }

  // ============================================================
  // 업무 분석 — 통합분석
  // ============================================================

  analyzeWorkIntegrated() {
    const me = this.messages.filter((m) => this.isFromMe(m));
    const other = this.messages.filter((m) => !this.isFromMe(m));
    const all = this.messages;

    // ===== 전체 톤 분석 + 근거 =====
    let overallTone = '일상적인 협업 대화';
    let toneEvidence = '';

    const exclamationRatio = all.filter((m) => /[!！]/.test(m.content)).length / Math.max(all.length, 1);
    const formalWords = all.filter((m) => /(드립니다|부탁드립니다|감사합니다|수고하셨|검토|회의|일정)/.test(m.content));
    const casualWords = all.filter((m) => /(ㅋㅋ|ㅎㅎ|ㅇㅇ|넹|ㄱㄱ|ㅇㅋ)/.test(m.content));
    const questionCount = all.filter((m) => /\?/.test(m.content)).length;

    if (formalWords.length > casualWords.length && formalWords.length > 2) {
      overallTone = '격식 있는 비즈니스 대화';
      toneEvidence = `"${formalWords[0].content.slice(0, 30)}" 같은 격식 표현이 ${formalWords.length}회 등장`;
    } else if (casualWords.length > formalWords.length && casualWords.length > 2) {
      overallTone = '편한 팀 분위기에서의 대화';
      toneEvidence = `"${casualWords[0].content.slice(0, 30)}" 같은 캐주얼 표현이 ${casualWords.length}회 등장`;
    } else if (exclamationRatio > 0.3) {
      overallTone = '활발한 의견 교환';
      toneEvidence = `전체 메시지의 ${Math.round(exclamationRatio * 100)}%에 강조 표현이 있어요`;
    } else if (questionCount >= 3) {
      overallTone = '질문을 통한 탐색적 논의';
      toneEvidence = `${questionCount}개의 질문이 오갔어요`;
    } else if (me.length > 0 && other.length === 0) {
      overallTone = '단방향 전달 (읽기 전용)';
      toneEvidence = `상대방이 보낸 메시지가 없어요`;
    } else if (other.length > 0 && me.length === 0) {
      overallTone = '받는 쪽 (공지/안내)';
      toneEvidence = `내가 보낸 메시지가 없어요`;
    } else {
      toneEvidence = `총 ${all.length}개의 메시지가 오갔어요`;
    }

    // ===== 주요 주제/테마 (인용 포함) =====
    const stopwords = new Set([
      '그래서', '근데', '그리고', '그럼', '지금', '오늘', '내일', '어제',
      '진짜', '정말', '좀', '좀만', '너무', '아주', '일단', '아', '어',
      '네', '넵', '넹', '응', 'ㅇㅇ', 'ㅇㅋ', 'ㅋㅋ', 'ㅎㅎ', 'ㅇㅇㅇ',
      '하나', '두', '세', '네', '다섯', '그냥', 'ㅇㅋㅇㅋ', '오케이',
      '그래', '맞아', '맞음', '아니', 'ㄴㄴ', 'ㄱㄱ', '웅', 'ㅇ', '넵!',
      '...', '..',
    ]);

    // [개선] 더 긴 시퀀스(2-3 단어 조합)도 추출
    const phraseCounts = {};
    for (const m of all) {
      const cleaned = m.content.replace(/[^\w가-힣\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const words = cleaned.split(' ').filter((w) => w.length >= 2 && !stopwords.has(w) && !/^\d+$/.test(w));
      // 1-gram
      for (const w of words) phraseCounts[w] = (phraseCounts[w] || 0) + 1;
      // 2-gram
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`;
        phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 2; // 2-gram 가중치
      }
    }

    const themes = Object.entries(phraseCounts)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([w]) => w);

    // 각 주제에 대한 인용 메시지 찾기
    const themeQuotes = {};
    for (const theme of themes) {
      const themeWords = theme.split(' ');
      const matches = all
        .filter((m) => themeWords.every((w) => m.content.includes(w)))
        .slice(0, 2)
        .map((m) => ({
          text: m.content.length > 80 ? m.content.slice(0, 80) + '…' : m.content,
          from: m.sender,
        }));
      if (matches.length > 0) themeQuotes[theme] = matches;
    }

    // ===== 협업 시그널 =====
    const collabSignals = [];
    const collabPatterns = [
      { re: /도와|도와줄|도움|헬프|같이/, msg: '서로 돕는 분위기' },
      { re: /공유|전달|알려줄|알려줘/, msg: '정보를 공유하는 흐름' },
      { re: /검토|확인해|피드백|코멘트/, msg: '건설적인 피드백 교환' },
      { re: /합시다|하자|진행|오케이|ok/i, msg: '명확한 합의와 진행' },
    ];
    for (const { re, msg } of collabPatterns) {
      if (all.some((m) => re.test(m.content))) collabSignals.push(msg);
    }

    // ===== 리스크 (인용 포함) =====
    const risks = [];
    const riskQuotes = {};
    const riskPatterns = [
      { re: /지연|늦|마감|deadline|빠듯/, msg: '일정 지연 가능성' },
      { re: /문제|이슈|버그|에러|실패|안됨|안 됨/, msg: '기술적 이슈 발생' },
      { re: /갈등|불만|답답|짜증|불화|충돌|불편/, msg: '팀 내 긴장감' },
      { re: /불확실|모르겠|확인 필요|미정|잘 모르겠/, msg: '불확실한 정보 다수' },
      { re: /부족|모자라|떨어지|힘들어|부담/, msg: '리소스/역량 부족' },
    ];
    for (const { re, msg } of riskPatterns) {
      const matches = all.filter((m) => re.test(m.content));
      if (matches.length > 0) {
        risks.push(msg);
        riskQuotes[msg] = matches.slice(0, 2).map((m) => ({
          text: m.content.length > 80 ? m.content.slice(0, 80) + '…' : m.content,
          from: m.sender,
        }));
      }
    }

    return {
      themes,
      theme_quotes: themeQuotes,
      overall_tone: overallTone,
      tone_evidence: toneEvidence,
      collaboration_signals: collabSignals.slice(0, 4),
      risks: risks.slice(0, 4),
      risk_quotes: riskQuotes,
    };
  }

  // ============================================================
  // 업무 분석 — 액션 아이템
  // ============================================================

  analyzeWorkActions() {
    const actions = [];
    for (const m of this.messages) {
      const c = m.content.trim();
      if (!c) continue;
      // TODO / 부탁 / 다음 / ~할게 / ~해보자 패턴
      if (/(TODO|todo|할게|해보자|해볼게|부탁|주세요|필요|해야|예정)/.test(c)) {
        const trimmed = c.length > 80 ? c.slice(0, 80) + '…' : c;
        actions.push({
          text: trimmed,
          from: m.sender,
        });
      }
    }
    return Array.from(new Set(actions.map((a) => a.text)))
      .map((text) => {
        const a = actions.find((x) => x.text === text);
        return { text, from: a?.from };
      })
      .slice(0, 6);
  }

  // ============================================================
  // 빠른 조언
  // ============================================================

  analyzeQuickAdvice() {
    const text = this.messages.map((m) => m.content).join(' ').trim();
    if (!text) {
      return {
        headline: '텍스트가 비어 있어요',
        advice: '조언을 받으려면 메시지를 1개 이상 선택해주세요.',
        tone: 'neutral',
        emoji: '🤔',
      };
    }

    // 간단한 휴리스틱: 의문형/요청형/부정 감정/긍정 감정 분류
    const isQuestion = /\?|언제|왜|어떻게|뭐|어디/.test(text);
    const hasAffection = /(좋아|사랑|보고 싶|그립|감사|고마워)/.test(text);
    const isUpset = /(짜증|화나|슬퍼|우울|힘들|지치|속상|섭섭)/.test(text);
    const isCasual = /(ㅋㅋ|ㅎㅎ|ㅇㅇ|ㅇㅋ|넹|넵)/.test(text);

    let advice;
    let tone = 'neutral';
    let emoji = '💭';

    if (isUpset) {
      advice = '상대방이 감정적으로 힘들어 보여요. 일단 공감 한 마디부터 시작해보세요. "그랬구나, 많이 힘들었겠다" 같은 한 줄이면 충분해요.';
      tone = 'supportive';
      emoji = '🤗';
    } else if (isQuestion) {
      advice = '질문을 받았어요. 바로 답을 모르겠으면 "잠깐 생각해볼게" 같은 시간 확보 답장도 좋아요. 그 다음 진심으로 답해주세요.';
      tone = 'helpful';
      emoji = '🤔';
    } else if (hasAffection) {
      advice = '상대방이 호감을 표현했어요. 같은 톤으로 받아주면 좋아요. "나도 너 좋아해"처럼 진심을 담아 답하면 분위기가 더 좋아져요.';
      tone = 'warm';
      emoji = '💗';
    } else if (isCasual) {
      advice = '가벼운 톤의 메시지예요. 너무 무겁지 않게 리액션을 보내보세요. 짧아도 "ㅋㅋ 진짜?", "오 대박" 같은 한 마디로 충분히 이어져요.';
      tone = 'casual';
      emoji = '😊';
    } else {
      advice = '"음… 그랬구나"로 시작하면 부담 없이 대화를 이어갈 수 있어요. 상대방의 말을 먼저 받아주고, 그 다음에 내 이야기를 덧붙이는 순서가 자연스러워요.';
      tone = 'neutral';
      emoji = '💬';
    }

    return {
      headline: '한 줄 조언',
      advice,
      tone,
      emoji,
    };
  }

  // ============================================================
  // 종합 결과
  // ============================================================

  buildComprehensive(results) {
    const e = results.emotion || {};
    const i = results.interest || {};
    const a = results.advice || {};
    const r = results.replies || {};

    const dayCount = this.messages.length > 0
      ? Math.max(1, Math.ceil((Date.now() - (this.messages[0].timestamp?.getTime?.() || Date.now())) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      summary: {
        overview: `${this.otherSender || '상대방'}과의 대화 ${this.stats.total}개 분석. 감정 ${e.overall || '중립'}, 관심도 ${i.level || '보통'}.`,
        duration: `${dayCount}일`,
        message_count: this.stats.total,
      },
      emotion: {
        overall: e.overall || '중립',
        emoji: e.emoji || '😐',
        description: e.description || '',
      },
      interest: {
        level: i.level || '보통',
        score: i.score || 5,
        evidence: (i.evidence || []).slice(0, 3),
      },
      analysis: {
        my_mistakes: (a.my_mistakes || []).slice(0, 3),
        good_points: (a.good_points || []).slice(0, 3),
        missed_signals: (i.missedSignals || []).slice(0, 3),
      },
      suggestions: {
        best_replies: (r.suggestions || []).slice(0, 3).map((s) => ({ reply: s.text, tone: s.tone })),
        next_action: (r.suggestions?.[0]?.text) || '자연스러운 대화를 이어가세요.',
      },
    };
  }
}

// ============================================================
// 모듈 export
// ============================================================

export { HeuristicAnalyzer };
export default HeuristicAnalyzer;
