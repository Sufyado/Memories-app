import { useLocalSearchParams } from 'expo-router';

import { Screen, Text } from '@/design-system';

export default function StoryEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <Text variant="title">Edit Story {id}</Text>
    </Screen>
  );
}
