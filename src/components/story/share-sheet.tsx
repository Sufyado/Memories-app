import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { createShareLink, getShareLink, getShareUrl, setShareLinkActive } from '@/lib/data/share-links';
import { useI18n } from '@/lib/i18n';
import type { ShareLink } from '@/types/domain';

export function ShareSheet({
  visible,
  onClose,
  storyId,
  storyTitle,
  userId,
}: {
  visible: boolean;
  onClose: () => void;
  storyId: string;
  storyTitle: string;
  userId: string;
}) {
  const { t } = useI18n();
  const [link, setLink] = useState<ShareLink | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    // Reset to the loading state each time the sheet is (re)opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLink(undefined);
    getShareLink(storyId)
      .then(setLink)
      .catch(() => setLink(null));
  }, [visible, storyId]);

  if (!visible) return null;

  const handleCreate = async () => {
    setBusy(true);
    try {
      setLink(await createShareLink({ storyId, createdBy: userId, storyTitle, visibility: 'link' }));
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async () => {
    if (!link) return;
    setBusy(true);
    try {
      setLink(await setShareLinkActive(link.id, !link.isActive));
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!link) return;
    await Clipboard.setStringAsync(getShareUrl(link.slug));
    Alert.alert(t('share.copied'));
  };

  const handleNativeShare = async () => {
    if (!link) return;
    const url = getShareUrl(link.slug);
    try {
      await Share.share({ message: url, url });
    } catch {
      // user cancelled or the platform has no share sheet — nothing to do
    }
  };

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
        <Text style={styles.title}>{t('share.title')}</Text>

        {link === undefined ? (
          <ActivityIndicator color="#fff" />
        ) : link === null ? (
          <Button label={t('share.createLink')} onPress={handleCreate} disabled={busy} />
        ) : (
          <View style={styles.linkSection}>
            <Text style={styles.url} numberOfLines={1}>
              {getShareUrl(link.slug)}
            </Text>
            {!link.isActive ? <Text style={styles.note}>{t('share.inactiveNote')}</Text> : null}
            <View style={styles.buttonRow}>
              <Button label={t('share.copyLink')} variant="secondary" onPress={handleCopy} disabled={!link.isActive} />
              <Button label={t('viewer.share')} variant="secondary" onPress={handleNativeShare} disabled={!link.isActive} />
            </View>
            <Button
              label={link.isActive ? t('share.deactivate') : t('share.reactivate')}
              variant="ghost"
              onPress={handleToggle}
              disabled={busy}
            />
          </View>
        )}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 4,
  },
  card: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  linkSection: {
    gap: Spacing.two,
  },
  url: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  note: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
