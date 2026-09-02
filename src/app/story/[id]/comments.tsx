import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { SignInPrompt } from '@/components/ui/sign-in-prompt';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/auth-provider';
import { useComments } from '@/lib/data/use-comments';
import { formatUpdatedAt } from '@/lib/format-date';
import { useI18n } from '@/lib/i18n';
import type { Comment } from '@/types/domain';

export default function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const { comments, profilesById, loading, error, refresh, post } = useComments(id);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  const handleSend = async () => {
    if (!user || !draft.trim()) return;
    setPosting(true);
    try {
      await post(user.id, draft);
      setDraft('');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Screen title={t('storyDetail.commentsTitle')} showBackButton scroll={false}>
      <View style={styles.list}>
        {loading ? (
          <ActivityIndicator style={styles.spinner} />
        ) : error ? (
          <View style={styles.errorWrap}>
            <ThemedText type="small" themeColor="danger">
              {t('common.error')}
            </ThemedText>
            <Button label={t('common.retry')} variant="secondary" onPress={refresh} />
          </View>
        ) : comments.length === 0 ? (
          <EmptyState
            icon={{ ios: 'bubble.right', android: 'chat_bubble', web: 'chat_bubble' }}
            title={t('storyDetail.noCommentsTitle')}
            subtitle={t('storyDetail.noCommentsSubtitle')}
          />
        ) : (
          comments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              authorName={profilesById[comment.authorId]?.displayName ?? '—'}
              timeLabel={formatUpdatedAt(comment.createdAt, locale)}
            />
          ))
        )}
      </View>

      {user ? (
        <View style={styles.composerRow}>
          <View style={styles.composerField}>
            <Input value={draft} onChangeText={setDraft} placeholder={t('storyDetail.commentPlaceholder')} />
          </View>
          <Button label={t('common.save')} onPress={handleSend} disabled={posting || !draft.trim()} />
        </View>
      ) : (
        <SignInPrompt title={t('library.signInTitle')} subtitle={t('library.signInSubtitle')} />
      )}
    </Screen>
  );
}

function CommentRow({
  comment,
  authorName,
  timeLabel,
}: {
  comment: Comment;
  authorName: string;
  timeLabel: string;
}) {
  return (
    <ThemedView type="backgroundElement" style={styles.commentRow}>
      <View style={styles.commentHeader}>
        <ThemedText type="smallBold">{authorName}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {timeLabel}
        </ThemedText>
      </View>
      <ThemedText type="small">{comment.text}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    gap: Spacing.two,
  },
  spinner: {
    marginTop: Spacing.six,
  },
  errorWrap: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.six,
  },
  commentRow: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  composerField: {
    flex: 1,
  },
});
