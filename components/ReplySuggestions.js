/**
 * 답장 추천 컴포넌트
 *
 * 상황별 추천 답장 카드를 표시
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Clipboard } from 'react-native';
import { Card, IconButton, Button, Chip } from 'react-native-paper';

function ReplySuggestions({ data }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  // 데이터 파싱
  const categories = data?.categories || {};
  const replies = data?.replies || [];
  const defaultReplies = data?.default || [];

  // 카테고리 목록
  const categoryList = [
    { key: 'all', label: '전체' },
    { key: 'greeting', label: '인사' },
    { key: 'question', label: '질문' },
    { key: 'flirty', label: 'Flairt' },
    { key: 'concern', label: '걱정' },
    { key: 'apologize', label: ' 사과' },
  ];

  // 필터링된 답장
  const filteredReplies = selectedCategory === 'all'
    ? replies
    : replies.filter((r) => r.category === selectedCategory);

  // ===== 복사 처리 =====
  const handleCopy = (reply, id) => {
    Clipboard.setString(reply.text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ===== 카테고리가 없을 때 기본 답장 =====
  if (!replies.length && !defaultReplies.length) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.placeholder}>추천 답장을 불러오는 중...</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <View>
      {/* 추천 답장 목록 */}
      {filteredReplies.length > 0 ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>추천 답장</Text>
            <Text style={styles.cardSubtitle}>
              탭하면 복사됩니다
            </Text>

            {/* 카테고리 필터 */}
            <View style={styles.categoryFilter}>
              {categoryList.map((cat) => (
                <Chip
                  key={cat.key}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat.key && styles.categoryChipActive,
                  ]}
                  textStyle={[
                    styles.categoryChipText,
                    selectedCategory === cat.key && styles.categoryChipTextActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.key)}
                  compact
                >
                  {cat.label}
                </Chip>
              ))}
            </View>

            {/* 답장 목록 */}
            {filteredReplies.map((reply, index) => (
              <ReplyItem
                key={reply.id || index}
                reply={reply}
                onCopy={() => handleCopy(reply, reply.id || index)}
                isCopied={copiedId === (reply.id || index)}
              />
            ))}
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.placeholder}>
              이 카테고리에 맞는 답장이 없습니다.
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* 상황별 답장 */}
      {Object.entries(categories).map(([category, items]) => (
        <Card key={category} style={styles.card}>
          <Card.Content>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>
                {getCategoryEmoji(category)} {getCategoryName(category)}
              </Text>
              <Chip compact style={styles.countChip}>
                {items.length}
              </Chip>
            </View>

            {items.map((item, index) => (
              <ReplyItem
                key={index}
                reply={{ text: item }}
                onCopy={() => handleCopy({ text: item }, `${category}-${index}`)}
                isCopied={copiedId === `${category}-${index}`}
              />
            ))}
          </Card.Content>
        </Card>
      ))}

      {/* 사용 팁 */}
      <Card style={styles.tipCard}>
        <Card.Content>
          <Text style={styles.tipTitle}>💡 답장 사용 팁</Text>
          <Text style={styles.tipText}>
            • 상황에 맞게 내용을 수정해서 보내세요{'\n'}
            • 너무 완벽한 답장은有些不自然해 보일 수 있어요{'\n'}
            • 본인의 말투를 섞어 쓰면 더 자연스럽습니다{'\n'}
            • 감정 이모지를 추가하면 톤이 따뜻해집니다
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

// ===== 개별 답장 아이템 =====
function ReplyItem({ reply, onCopy, isCopied }) {
  const { text, tone, emoji, category } = reply;

  return (
    <TouchableOpacity
      style={[styles.replyItem, isCopied && styles.replyItemCopied]}
      onPress={onCopy}
      activeOpacity={0.7}
    >
      <View style={styles.replyContent}>
        <View style={styles.replyHeader}>
          {emoji && <Text style={styles.replyEmoji}>{emoji}</Text>}
          {tone && (
            <Chip
              compact
              style={styles.toneChip}
              textStyle={styles.toneChipText}
            >
              {tone}
            </Chip>
          )}
        </View>
        <Text style={styles.replyText}>{text}</Text>
      </View>

      <View style={styles.copyIndicator}>
        <IconButton
          icon={isCopied ? 'check' : 'content-copy'}
          size={18}
          iconColor={isCopied ? '#10B981' : '#9CA3AF'}
        />
        <Text style={[styles.copyText, isCopied && styles.copyTextDone]}>
          {isCopied ? '복사됨' : '복사'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ===== 헬퍼 함수 =====
function getCategoryEmoji(category) {
  const map = {
    greeting: '👋',
    question: '❓',
    flirty: '😘',
    concern: '🥺',
    apologize: '🙏',
    casual: '😊',
    date: '💕',
    breakup: '💔',
    fight: '😤',
  };
  return map[category] || '💬';
}

function getCategoryName(category) {
  const map = {
    greeting: '인사',
    question: '질문',
    flirty: '플러트',
    concern: '걱정',
    apologize: '사과',
    casual: '일상',
    date: '데이트',
    breakup: '이별',
    fight: '다툼',
  };
  return map[category] || category;
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  placeholder: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
  },
  categoryFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  categoryChip: {
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: '#F3F4F6',
  },
  categoryChipActive: {
    backgroundColor: '#6366F1',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  replyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  replyItemCopied: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  replyContent: {
    flex: 1,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  replyEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  toneChip: {
    backgroundColor: '#EEF2FF',
    height: 22,
  },
  toneChipText: {
    fontSize: 11,
    color: '#6366F1',
  },
  replyText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
  },
  copyIndicator: {
    alignItems: 'center',
    marginLeft: 8,
    minWidth: 48,
  },
  copyText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: -4,
  },
  copyTextDone: {
    color: '#10B981',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  countChip: {
    backgroundColor: '#F3F4F6',
    height: 22,
  },
  tipCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 22,
  },
});

export default ReplySuggestions;
