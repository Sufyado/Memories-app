import React, { useState } from 'react';
import { Modal, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../ThemeProvider';
import { Text } from './Text';
import { Input } from './Input';
import { Button } from './Button';

type PromptModalProps = {
  visible: boolean;
  title: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
};

export function PromptModal({ visible, onClose, ...rest }: PromptModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Mounted only while visible, so its state starts fresh from initialValue every time it
       * opens — avoids syncing state from a prop via an effect. */}
      {visible ? <PromptModalContent onClose={onClose} {...rest} /> : null}
    </Modal>
  );
}

function PromptModalContent({
  title,
  placeholder,
  initialValue = '',
  submitLabel,
  onSubmit,
  onClose,
}: Omit<PromptModalProps, 'visible'>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [value, setValue] = useState(initialValue);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: theme.colors.surfaceRaised,
          borderRadius: theme.radius.lg,
          padding: 20,
          gap: 16,
        }}
      >
        <Text variant="subtitle" weight="semibold">
          {title}
        </Text>
        <Input value={value} onChangeText={setValue} placeholder={placeholder} autoFocus />
        <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
          <Button label={t('common.cancel')} variant="ghost" onPress={onClose} />
          <Button
            label={submitLabel ?? t('common.save')}
            onPress={() => {
              if (value.trim()) onSubmit(value.trim());
            }}
            disabled={!value.trim()}
          />
        </View>
      </View>
    </View>
  );
}
