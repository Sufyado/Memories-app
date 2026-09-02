import { Link, Stack } from 'expo-router';

import { Screen, Text } from '@/design-system';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen>
        <Text variant="title" weight="semibold">
          This screen doesn't exist.
        </Text>
        <Link href="/" style={{ marginTop: 16 }}>
          <Text color="brand">Go to home screen</Text>
        </Link>
      </Screen>
    </>
  );
}
