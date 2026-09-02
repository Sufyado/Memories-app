import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spacing } from '@/constants/theme';
import { useStoryMembers } from '@/lib/data/use-story-members';
import { useI18n } from '@/lib/i18n';
import type { TeamRole } from '@/types/domain';

export function TeamSection({ storyId }: { storyId: string }) {
  const { t } = useI18n();
  const { members, loading, invite, remove } = useStoryMembers(storyId);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<TeamRole, 'owner'>>('viewer');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    try {
      await invite(email, role);
      setEmail('');
    } catch (e) {
      const message = e instanceof Error && e.message.includes('No account found') ? t('team.userNotFound') : undefined;
      Alert.alert(t('common.error'), message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = (userId: string) => {
    Alert.alert(t('team.removeConfirmTitle'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => remove(userId) },
    ]);
  };

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {t('team.title')}
      </ThemedText>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.memberList}>
          {members.map((member) => (
            <ThemedView key={member.userId} type="backgroundElement" style={styles.memberRow}>
              <ThemedText type="small" style={styles.memberName} numberOfLines={1}>
                {member.displayName ?? '—'}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {member.role === 'editor' ? t('team.roleEditor') : t('team.roleViewer')}
              </ThemedText>
              <Pressable accessibilityRole="button" onPress={() => handleRemove(member.userId)} hitSlop={8}>
                <ThemedText type="caption" themeColor="danger">
                  {t('common.delete')}
                </ThemedText>
              </Pressable>
            </ThemedView>
          ))}
        </View>
      )}

      <View style={styles.inviteRow}>
        <View style={styles.inviteField}>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder={t('team.inviteEmailPlaceholder')}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <RoleToggle role={role} onChange={setRole} />
      </View>
      <Button label={t('team.invite')} variant="secondary" onPress={handleInvite} disabled={inviting || !email.trim()} />
    </View>
  );
}

function RoleToggle({
  role,
  onChange,
}: {
  role: Exclude<TeamRole, 'owner'>;
  onChange: (role: Exclude<TeamRole, 'owner'>) => void;
}) {
  const { t } = useI18n();

  return (
    <View style={styles.roleToggle}>
      {(['viewer', 'editor'] as const).map((option) => (
        <Pressable key={option} accessibilityRole="button" onPress={() => onChange(option)}>
          <ThemedView type={role === option ? 'backgroundSelected' : 'backgroundElement'} style={styles.rolePill}>
            <ThemedText type="caption" themeColor={role === option ? 'text' : 'textSecondary'}>
              {option === 'editor' ? t('team.roleEditor') : t('team.roleViewer')}
            </ThemedText>
          </ThemedView>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  memberList: {
    gap: Spacing.one,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.three,
  },
  memberName: {
    flex: 1,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  inviteField: {
    flex: 1,
  },
  roleToggle: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  rolePill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.five,
  },
});
