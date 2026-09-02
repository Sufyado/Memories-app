import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { Button } from './Button';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      {icon}
      <Text variant="title" weight="semibold" align="center" style={styles.title}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" color="secondary" align="center" style={styles.desc}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  title: { marginTop: 16 },
  desc: { marginTop: 8 },
  action: { marginTop: 20, minWidth: 160 },
});
