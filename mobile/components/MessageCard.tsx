import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { Avatar } from './Avatar';
import { formatRelativeTime } from '../lib/format';

export type Emoji = '👍' | '👀' | '✅';

interface Props {
  firstName: string;
  lastName: string;
  avatarColor?: string | null;
  body: string;
  createdAt: string;
  pinned?: boolean;
  reactions?: Partial<Record<Emoji, number>>;
  myReactions?: Emoji[];
  onToggleReaction?: (e: Emoji) => void;
}

const EMOJIS: Emoji[] = ['👍', '👀', '✅'];

export function MessageCard({
  firstName,
  lastName,
  avatarColor,
  body,
  createdAt,
  pinned,
  reactions,
  myReactions,
  onToggleReaction,
}: Props) {
  return (
    <View style={[styles.card, pinned && styles.pinned]}>
      <View style={styles.row}>
        <Avatar firstName={firstName} lastName={lastName} color={avatarColor} size={32} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>
            {firstName} {lastName}
          </Text>
          <Text style={styles.time}>{formatRelativeTime(createdAt)}</Text>
        </View>
        {pinned ? <Text style={styles.pinTag}>PINNED</Text> : null}
      </View>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.reactions}>
        {EMOJIS.map((e) => {
          const mine = myReactions?.includes(e);
          const count = reactions?.[e] ?? 0;
          return (
            <Pressable
              key={e}
              onPress={() => onToggleReaction?.(e)}
              style={({ pressed }) => [
                styles.reaction,
                mine && styles.reactionMine,
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={{ fontSize: 14 }}>{e}</Text>
              {count > 0 ? <Text style={styles.reactionCount}>{count}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  pinned: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { ...Typography.bodyLG, color: Colors.textPrimary, fontWeight: '700' },
  time: { ...Typography.caption, color: Colors.textSecondary },
  pinTag: { ...Typography.overline, color: Colors.accent },
  body: { ...Typography.bodyLG, color: Colors.textPrimary },
  reactions: { flexDirection: 'row', gap: Spacing.sm },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.cardHover,
  },
  reactionMine: {
    backgroundColor: Colors.accentSoft,
  },
  reactionCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
