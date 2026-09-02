import { useLocalSearchParams } from 'expo-router';

import { Screen, Text } from '@/design-system';

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <Text variant="title">Folder {id}</Text>
    </Screen>
  );
}
