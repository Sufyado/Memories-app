import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, Button, IconButton, Input, Text, useTheme } from '@/design-system';
import { useAddComment, useComments } from '@/features/comments/hooks';
import type { Story } from '@/types/domain';
import { formatRelative } from '@/utils/date';

type StoryInfoSheetProps = {
  visible: boolean;
  story: Story;
  onClose: () => void;
};

export function StoryInfoSheet({ visible, story, onClose }: StoryInfoSheetProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const comments = useComments(visible ? story.id : undefined);
  const addComment = useAddComment(story.id);
  const [text, setText] = useState('');

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <Text variant="subtitle" weight="semibold">
            {t('story.viewerInfo')}
          </Text>
          <IconButton accessibilityLabel={t('common.close')} onPress={onClose}>
            <Text>{t('common.close')}</Text>
          </IconButton>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
          <View style={{ gap: 6 }}>
            <Text variant="title" weight="bold">
              {story.title || t('common.untitled')}
            </Text>
            {story.description ? (
              <Text variant="body" color="secondary">
                {story.description}
              </Text>
            ) : null}
            <Text variant="caption" color="secondary">
              {t('story.version', { version: story.version })} · {t('story.updatedAt', { date: formatRelative(story.updated_at, i18n.language) })}
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            <Text variant="label" weight="semibold" color="secondary">
              {t('story.comments')}
            </Text>
            {comments.data?.map((comment) => (
              <View key={comment.id} style={{ flexDirection: 'row', gap: 10 }}>
                <Avatar name={comment.author?.full_name} uri={comment.author?.avatar_url} size={32} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="caption" weight="semibold">
                    {comment.author?.full_name ?? '—'}
                  </Text>
                  <Text variant="body">{comment.text}</Text>
                  <Text variant="label" color="muted">
                    {formatRelative(comment.created_at, i18n.language)}
                  </Text>
                </View>
              </View>
            ))}
            {comments.data && comments.data.length === 0 ? (
              <Text variant="caption" color="secondary">
                —
              </Text>
            ) : null}
          </View>
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <Input value={text} onChangeText={setText} placeholder={t('story.comment')} />
          </View>
          <Button
            label={t('common.add')}
            disabled={!text.trim()}
            loading={addComment.isPending}
            onPress={() => {
              addComment.mutate(text.trim(), { onSuccess: () => setText('') });
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
