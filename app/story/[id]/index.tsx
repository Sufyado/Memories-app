import { useLocalSearchParams } from 'expo-router';

import { Screen, Text } from '@/design-system';

export default function StoryViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <Text variant="title">Story {id}</Text>
    </Screen>
  );
}
