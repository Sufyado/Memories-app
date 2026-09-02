import React, { useState } from 'react';
import { Alert, Share, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Avatar, Button, Card, Chip, IconButton, Input, LoadingView, Screen, Text, useTheme } from '@/design-system';
import { useStory, useUpdateStoryMeta } from '@/features/stories/hooks';
import { useActiveShareLink, useCreateShareLink, useSetShareLinkActive } from '@/features/sharing/hooks';
import { getShareUrl } from '@/features/sharing/url';
import { useInviteMember, useMembers, useRemoveMember, useUpdateMemberRole } from '@/features/team/hooks';
import { useAuth } from '@/features/auth/AuthProvider';
import type { StoryRole, StoryVisibility } from '@/types/domain';

const VISIBILITIES: StoryVisibility[] = ['private', 'team', 'public'];
const ROLES: StoryRole[] = ['viewer', 'editor'];

export default function ShareSettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const story = useStory(id);
  const updateStoryMeta = useUpdateStoryMeta();
  const shareLink = useActiveShareLink(id);
  const createShareLink = useCreateShareLink(id, story.data?.title ?? '');
  const setLinkActive = useSetShareLinkActive(id);

  const members = useMembers(id);
  const inviteMember = useInviteMember(id);
  const removeMember = useRemoveMember(id);
  const updateMemberRole = useUpdateMemberRole(id);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StoryRole>('viewer');

  if (story.isLoading) return <LoadingView />;
  if (!story.data) return null;

  async function setVisibility(visibility: StoryVisibility) {
    updateStoryMeta.mutate({ id, patch: { visibility } });
  }

  async function onCreateLink() {
    await createShareLink.mutateAsync();
    await setVisibility('public');
  }

  async function onCopyLink() {
    if (!shareLink.data) return;
    await Clipboard.setStringAsync(getShareUrl(shareLink.data.slug));
    Alert.alert(t('share.linkCopied'));
  }

  async function onNativeShare() {
    let link = shareLink.data;
    if (!link) {
      link = await createShareLink.mutateAsync();
      await setVisibility('public');
    }
    await Share.share({ message: getShareUrl(link.slug), url: getShareUrl(link.slug) });
  }

  async function onInvite() {
    if (!inviteEmail.trim()) return;
    try {
      await inviteMember.mutateAsync({ email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail('');
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('share.visibility') }} />
      <Screen scroll>
        <View style={{ gap: 24, paddingTop: 12 }}>
          <View style={{ gap: 10 }}>
            <Text variant="label" weight="semibold" color="secondary">
              {t('share.visibility')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {VISIBILITIES.map((v) => (
                <Chip key={v} label={t(`share.${v}`)} selected={story.data!.visibility === v} onPress={() => setVisibility(v)} />
              ))}
            </View>
          </View>

          {story.data.visibility === 'public' ? (
            <Card style={{ padding: 16, gap: 12 }}>
              {shareLink.data ? (
                <>
                  <Text variant="body" numberOfLines={1}>
                    {getShareUrl(shareLink.data.slug)}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    <Button size="sm" variant="secondary" label={t('share.copyLink')} onPress={onCopyLink} />
                    <Button size="sm" variant="secondary" label={t('common.share')} onPress={onNativeShare} />
                    {shareLink.data.is_active ? (
                      <Button
                        size="sm"
                        variant="danger"
                        label={t('share.disableLink')}
                        onPress={() => setLinkActive.mutate({ id: shareLink.data!.id, isActive: false })}
                      />
                    ) : (
                      <Button
                        size="sm"
                        label={t('share.enableLink')}
                        onPress={() => setLinkActive.mutate({ id: shareLink.data!.id, isActive: true })}
                      />
                    )}
                  </View>
                </>
              ) : (
                <Button label={t('share.createLink')} onPress={onCreateLink} loading={createShareLink.isPending} />
              )}
            </Card>
          ) : null}

          <View style={{ gap: 12 }}>
            <Text variant="label" weight="semibold" color="secondary">
              {t('share.team')}
            </Text>
            {members.data?.map((member) => (
              <Card key={member.user_id} style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Avatar name={member.profile?.full_name} uri={member.profile?.avatar_url} size={36} />
                <View style={{ flex: 1 }}>
                  <Text variant="body" weight="semibold" numberOfLines={1}>
                    {member.profile?.full_name ?? member.profile?.email}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {t(`roles.${member.role}`)}
                  </Text>
                </View>
                {member.role !== 'owner' && member.user_id !== user?.id ? (
                  <>
                    <Chip
                      label={t(`roles.${member.role === 'editor' ? 'viewer' : 'editor'}`)}
                      onPress={() =>
                        updateMemberRole.mutate({ userId: member.user_id, role: member.role === 'editor' ? 'viewer' : 'editor' })
                      }
                    />
                    <IconButton accessibilityLabel={t('common.delete')} onPress={() => removeMember.mutate(member.user_id)}>
                      <Ionicons name="close" size={16} color={theme.colors.danger} />
                    </IconButton>
                  </>
                ) : null}
              </Card>
            ))}

            <Card style={{ padding: 12, gap: 10 }}>
              <Input
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder={t('auth.email')}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {ROLES.map((role) => (
                  <Chip key={role} label={t(`roles.${role}`)} selected={inviteRole === role} onPress={() => setInviteRole(role)} />
                ))}
                <View style={{ flex: 1 }} />
                <Button size="sm" label={t('common.add')} onPress={onInvite} loading={inviteMember.isPending} />
              </View>
            </Card>
          </View>
        </View>
      </Screen>
    </>
  );
}
