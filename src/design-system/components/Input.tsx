import React, { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '../ThemeProvider';
import { Text } from './Text';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, style, onFocus, onBlur, ...rest }: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="label" weight="semibold" color="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            color: theme.colors.textPrimary,
            borderColor: error ? theme.colors.danger : focused ? theme.colors.brand : 'transparent',
            borderRadius: theme.radius.md,
          },
          style,
        ]}
      />
      {error ? (
        <Text variant="caption" color="danger" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  label: { marginBottom: 6 },
  input: {
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1.5,
  },
  error: { marginTop: 4 },
});
