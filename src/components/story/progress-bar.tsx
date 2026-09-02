import { StyleSheet, View } from 'react-native';

export function StoryProgressBar({ count, index, progress }: { count: number; index: number; progress: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${(i < index ? 1 : i === index ? progress : 0) * 100}%` },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  track: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#fff',
  },
});
