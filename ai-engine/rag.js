/**
 * RAG (검색 증강 생성) 시스템
 *
 * 상담 지식 베이스를 활용한 맥락 인식 응답 향상
 */

// ===== 상담 지식 베이스 =====

const KNOWLEDGE_BASE = [
  // ===== 연락 빈도 =====
  {
    id: 'freq_001',
    category: '연락 빈도',
    situation: '상대방이 연락을 안 함',
    triggers: ['연락 없다', '답장 없다', '언제 연락', '主动性'],
    analysis: '2가지 해석이 가능합니다: 정말 바쁜 경우, 또는 의도적으로 연락을 줄이는 경우',
    advice: '1-2일은 기다렸다가 가볍게 "요즘 많이 바빠?"라고 물어보세요. 직접적이지 않으면서 상황을 확인할 수 있습니다.',
    tone: '관심 있음但不黏',
    priority: 'high',
  },
  {
    id: 'freq_002',
    category: '연락 빈도',
    situation: '평소보다 연락이 뜸림',
    triggers: ['늘어남', '느려짐', '间隔变大'],
    analysis: '관심도가 하락하고 있거나 바쁜 일이 생겼을 수 있습니다.',
    advice: '자주 연락하기보다 질을 높이세요. 의미 있는 대화를 시도하고, 답이 짧으면 오히려 공간을 줘보세요.',
    tone: '쿨但关心',
    priority: 'high',
  },
  {
    id: 'freq_003',
    category: '연락 빈도',
    situation: '내가 먼저 연락해야 하나',
    triggers: ['누가 먼저', '先联络', ' initiator'],
    analysis: '여성이 먼저 연락하면 관심 없거나 억지로라는 인식을 줄 수 있지만, 한국 사회에서는 남성이 먼저 연락하는 것이 일반적입니다.',
    advice: '좋아하는 거 있으면 먼저 연락하세요. 억지로 "안 연락해야지" 하면 기회는 사라집니다.',
    tone: '积极',
    priority: 'medium',
  },

  // ===== 답장 속도 =====
  {
    id: 'speed_001',
    category: '답장 속도',
    situation: '답장이 점점 느려짐',
    triggers: ['답장 느려짐', '间隔变长', '越来越慢'],
    analysis: '가장 명확한 관심도 하락 신호입니다. 처음엔 바로 답장하다渐渐慢下来.',
    advice: '답장을 재촉하지 마세요. 더感兴趣한 다른 사람을 찾았을 가능성이 높습니다.',
    tone: '쿨',
    priority: 'high',
  },
  {
    id: 'speed_002',
    category: '답장 속도',
    situation: '답장은 빠르지만 내용이 짧음',
    triggers: ['답장 짧음', '1-2단어', '敷衍'],
    analysis: '답장은 하지만 관심이 없는礼貌적 반응일 수 있습니다.',
    advice: '대화 자체를 재밌게 만들어야 합니다. 그냥 "안녕 뭐해?"는 피하고,话题를 던져보세요.',
    tone: '재미있게',
    priority: 'medium',
  },
  {
    id: 'speed_003',
    category: '답장 속도',
    situation: '읽씹 (읽고 답장 안 함)',
    triggers: ['읽씹', '已读不回', '읽고 안 답함'],
    analysis: '의도적으로 안 하는 것이 대부분입니다. 들었지만 답할 가치가 없다고 판단한 것.',
    advice: '한 번은 그냥 넘어가세요. 2-3일 후 가볍게 한번 더 연락하고, 그래도 안 되면 공간을 줍니다.',
    tone: '쿨但有底线',
    priority: 'high',
  },

  // ===== 첫 만남 =====
  {
    id: 'first_001',
    category: '첫 만남',
    situation: '첫 데이트 잡기',
    triggers: ['첫约会', '만나자', '나가자'],
    analysis: '만나자고 하는 쪽이 관심 있습니다. 바로 수락하면 좋고, 미루면观望 중.',
    advice: '만나자고 할 때 바로 날짜/시간/장소를 다 정해서 보내세요. 선택지를 주면検討する時間ができます.',
    tone: '결단력 있게',
    priority: 'high',
  },
  {
    id: 'first_002',
    category: '첫 만남',
    situation: '상대방이 만나자고 함',
    triggers: ['만나자고 함', '뭐 해', '나가자'],
    analysis: '상대방이 나에게 관심이 있다는 명확한 신호입니다.',
    advice: '바로 수락하세요. 고민하면 기회 잃습니다. 일정이 맞지 않으면 바로 대안을 제시하세요.',
    tone: '积极响应',
    priority: 'high',
  },
  {
    id: 'first_003',
    category: '첫 만남',
    situation: '약속 잡았는데 취소하려 함',
    triggers: ['취소', '바람', '일 있어'],
    analysis: '진짜 바쁜지借口的 경우도 있습니다. 취소하려는 이유를 살펴보세요.',
    advice: '바로 "그래 괜찮아"라고 하고 대안 날짜를 물어보세요. 억지로 만나게 해도 분위기 안 좋습니다.',
    tone: '쿨但在意',
    priority: 'medium',
  },

  // ===== 진짜/장난 =====
  {
    id: 'tone_001',
    category: '진짜/장난',
    situation: '호감인지 장난인지 모호함',
    triggers: ['장난', '놀림', '티 안 남'],
    analysis: '한국人は直接적으로 표현하지 않는 경향이 있습니다. 행동으로 봐야 합니다.',
    advice: '만나자고 하는지, 답장이 빠른지 등 행동으로判断하세요. 말보다 행동이 중요합니다.',
    tone: '观察',
    priority: 'medium',
  },
  {
    id: 'tone_002',
    category: '진짜/장난',
    situation: '이모티콘/이모지 해석',
    triggers: ['이모지', '이모티콘', 'ㅋㅋ', 'ㅎㅎ'],
    analysis: '이모티콘 사용 패턴으로 감정을 유추할 수 있습니다.',
    advice: 'ㅋㅋㅋㅋㅋ: 재밌다, ㅎㅎ:礼貌적 웃음, 이모지 추가: 관심이 있음의 신호',
    tone: '注意细节',
    priority: 'medium',
  },

  // ===== 데이트 후 =====
  {
    id: 'after_001',
    category: '데이트 후',
    situation: '데이트 후 연락',
    triggers: ['데이트 후', '만난 후', '다음 날'],
    analysis: '만난 날 밤이나 다음 날 연락이 일반적입니다. 2-3일 뒤면 약간 늦은 것.',
    advice: '만난 날 밤에 "오늘 만나서 재밌었어~" 또는 "집 잘 들어갔어?" 정도의 짧은 연락이 좋습니다.',
    tone: '가볍게',
    priority: 'high',
  },
  {
    id: 'after_002',
    category: '데이트 후',
    situation: '다음 데이트 잡기',
    triggers: ['다음에', '또 만나', '언제가'],
    analysis: '그자리에서 다음约会를 잡는 것이最好합니다. 미루면 기회 줄어듭니다.',
    advice: '만나면서 바로 "그럼 다음엔 ○○ 가보자"라고 말하세요.',
    tone: '결단력',
    priority: 'high',
  },

  // =====吵架/矛盾 =====
  {
    id: 'fight_001',
    category: '싸움/이별',
    situation: '소송 중',
    triggers: ['싸웠다', '다퉜', '화남'],
    analysis: '싸운 후가 가장 중요합니다.cooling off 후主动联系하는 것이 좋습니다.',
    advice: '같은 날 재촉하지 마세요. 하루 이틀 후 짧게 "내가 잘못했어" 또는 "밥이나 먹자"가 좋습니다.',
    tone: '认错但有原则',
    priority: 'high',
  },
  {
    id: 'fight_002',
    category: '싸움/이별',
    situation: '상대방이 cooled off',
    triggers: ['态度变冷', '冷淡', '차가움'],
    analysis: '관심이 줄었거나、미안함 등을 표현하지 못하는 것일 수 있습니다.',
    advice: '직접적으로 "왜 그래?" 물어보는 것보다, 평소처럼 가볍게 접근하세요.',
    tone: '平常心',
    priority: 'medium',
  },

  // =====特殊信号 =====
  {
    id: 'signal_001',
    category: '특별 신호',
    situation: '私有物 언급',
    triggers: ['집', '방', '室友', '同居'],
    analysis: '자신의 사적인 공간을 언급한다는 것은 편안함을 의미합니다.',
    advice: '긍정적 신호로 받아들이세요. 집에 초대하면 훨씬 진전이 있는 것입니다.',
    tone: '积极',
    priority: 'high',
  },
  {
    id: 'signal_002',
    category: '특별 신호',
    situation: '未来谈论',
    triggers: ['下次', '将来', '계획'],
    analysis: '상대방의 삶에 자신의未来를 포함시키고 있다는 것입니다.',
    advice: '좋은 신호입니다. 상대방도 관계의 발전을 생각하고 있다는 것입니다.',
    tone: '积极但不强求',
    priority: 'medium',
  },
  {
    id: 'signal_003',
    category: '특별 신호',
    situation: '身体接触',
    triggers: ['만짐', 'touch', '어깨', '손'],
    analysis: '신체 접촉은 한국 문화에서 큰 의미가 있습니다.',
    advice: '상대방이 먼저 접촉하면 호감의 신호입니다. 적극적으로 반응하세요.',
    tone: '积极响应',
    priority: 'high',
  },
];

/**
 * 지식 베이스 검색
 * @param {string} query - 검색 쿼리 (대화 내용)
 * @param {number} topK - 반환할 결과 수
 * @returns {Array} 관련 지식 목록
 */
function searchKnowledge(query, topK = 5) {
  if (!query || typeof query !== 'string') {
    return [];
  }

  const queryLower = query.toLowerCase();
  const scores = [];

  for (const item of KNOWLEDGE_BASE) {
    let score = 0;

    // 트리거 키워드 매칭
    for (const trigger of item.triggers) {
      if (queryLower.includes(trigger.toLowerCase())) {
        score += 10;
      }
    }

    // 카테고리 매칭
    if (queryLower.includes(item.category.toLowerCase())) {
      score += 5;
    }

    // 상황 매칭
    if (queryLower.includes(item.situation.toLowerCase())) {
      score += 8;
    }

    // 유사도 스코어 추가
    if (score > 0) {
      // 우선순위 가중치
      if (item.priority === 'high') {
        score *= 1.5;
      } else if (item.priority === 'medium') {
        score *= 1.2;
      }

      scores.push({
        ...item,
        score,
      });
    }
  }

  // 점수 순으로 정렬
  scores.sort((a, b) => b.score - a.score);

  // Top K 반환
  return scores.slice(0, topK);
}

/**
 * 특정 카테고리 지식 검색
 * @param {string} category - 카테고리
 * @returns {Array} 해당 카테고리 지식
 */
function getKnowledgeByCategory(category) {
  return KNOWLEDGE_BASE.filter(
    item => item.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * 모든 카테고리 목록
 */
function getCategories() {
  const categories = new Set(KNOWLEDGE_BASE.map(item => item.category));
  return Array.from(categories);
}

/**
 * 맥락에 맞는 프롬프트 생성
 */
function buildRAGEnhancedPrompt(basePrompt, knowledge) {
  if (!knowledge || knowledge.length === 0) {
    return basePrompt;
  }

  const knowledgeSection = `\n\n[상담 지식베이스 참고]:\n` +
    knowledge.map((k, i) =>
      `${i + 1}. [${k.category}] ${k.situation}\n   - 분석: ${k.analysis}\n   - 조언: ${k.advice}`
    ).join('\n') +
    '\n\n위 상담 지식을 참고하여 한국 문화 맥락에 맞는 분석을 제공해주세요.';

  return basePrompt + knowledgeSection;
}

/**
 * 지식 베이스 유효성 검사
 */
function validateKnowledgeBase() {
  const errors = [];

  for (const item of KNOWLEDGE_BASE) {
    if (!item.id) errors.push('ID 누락');
    if (!item.category) errors.push(`${item.id}: 카테고리 누락`);
    if (!item.situation) errors.push(`${item.id}: 상황 누락`);
    if (!item.advice) errors.push(`${item.id}: 조언 누락`);
    if (!item.triggers || item.triggers.length === 0) {
      errors.push(`${item.id}: 트리거 키워드 없음`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    count: KNOWLEDGE_BASE.length,
  };
}

// ===== 내보내기 (ESM) =====

export {
  // 데이터
  KNOWLEDGE_BASE,

  // 함수
  searchKnowledge,
  getKnowledgeByCategory,
  getCategories,
  buildRAGEnhancedPrompt,
  validateKnowledgeBase,
};

// ===== 테스트 코드 =====
// RN Metro 환경 호환: import.meta / process.argv 둘 다 안전하게 처리
const isMainModule = typeof process !== 'undefined' &&
                      typeof process.argv !== 'undefined' &&
                      process.argv[1] != null &&
                      (process.argv[1].endsWith('rag.js') ||
                       process.argv[1].endsWith('rag'));
if (isMainModule) {
  console.log('=== RAG 시스템 테스트 ===\n');

  // 유효성 검사
  const validation = validateKnowledgeBase();
  console.log(`지식 베이스 유효성: ${validation.isValid ? 'PASS' : 'FAIL'}`);
  console.log(`총 항목: ${validation.count}`);
  if (validation.errors.length > 0) {
    console.log('에러:', validation.errors);
  }

  // 검색 테스트
  console.log('\n--- Search Tests ---');

  const testQueries = [
    '연락 안 해요',
    '답장 느려졌어',
    '만나자고 했는데',
    '집에 대해 이야기함',
  ];

  for (const query of testQueries) {
    const results = searchKnowledge(query, 3);
    console.log(`\nSearch: "${query}"`);
    console.log(`Results: ${results.length}`);
    results.forEach((r, i) => {
      console.log(`  ${i + 1}. [${r.category}] ${r.situation} (score: ${r.score})`);
    });
  }

  // 카테고리 목록
  console.log('\n--- Categories ---');
  console.log(getCategories().join(', '));
}
