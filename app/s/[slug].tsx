import { useLocalSearchParams } from 'expo-router';

import { Screen, Text } from '@/design-system';

export default function PublicStoryViewerScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return (
    <Screen>
      <Text variant="title">Shared story {slug}</Text>
    </Screen>
  );
}
