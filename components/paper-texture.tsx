import { StyleSheet, View } from 'react-native';

type PaperTextureProps = {
  opacity?: number;
};

export function PaperTexture({ opacity = 0.02 }: PaperTextureProps) {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { opacity },
      ]}
      pointerEvents="none"
    >
      <View style={styles.grain} />
    </View>
  );
}

const styles = StyleSheet.create({
  grain: {
    flex: 1,
    backgroundColor: '#000',
    opacity: 0.5,
    transform: [{ scale: 2 }],
  },
});