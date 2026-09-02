import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/lib/i18n';

export function Input(props: TextInputProps) {
  const theme = useTheme();
  const { isRTL } = useI18n();

  return (
    <ThemedView type="backgroundElement" style={styles.wrap}>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
        {...props}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  input: {
    fontSize: 16,
  },
});
