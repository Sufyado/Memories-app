import React from 'react';
import { Animated, View } from 'react-native';

type StoryProgressBarProps = {
  count: number;
  currentIndex: number;
  progress: Animated.Value;
};

export function StoryProgressBar({ count, currentIndex, progress }: StoryProgressBarProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.35)',
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              height: '100%',
              backgroundColor: '#fff',
              width:
                index < currentIndex
                  ? '100%'
                  : index > currentIndex
                    ? '0%'
                    : progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }}
          />
        </View>
      ))}
    </View>
  );
}
