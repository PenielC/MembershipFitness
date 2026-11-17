import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

const WEEK = 7;

export function StreakCard({ streak }: { streak: number }) {
  const lit = Math.min(streak, WEEK);
  const message =
    streak === 0 ? 'Check in today to start a streak' : streak === 1 ? 'Day one — keep it going!' : `${streak} days in a row. Keep it up!`;
  return (
    <View style={styles.card} accessibilityLabel={`Current streak: ${streak} ${streak === 1 ? 'day' : 'days'}`}>
      <View style={styles.row}>
        <Ionicons name="flame" size={44} color={streak > 0 ? colors.flame : colors.disabled} />
        <View>
          <Text style={styles.number}>{streak}</Text>
          <Text style={styles.label}>day streak</Text>
        </View>
      </View>
      <View style={styles.dots}>
        {Array.from({ length: WEEK }, (_, i) => (
          <View key={i} testID={i < lit ? 'streak-dot-on' : 'streak-dot-off'} style={[styles.dot, i < lit && styles.dotOn]} />
        ))}
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 18, gap: 12, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  number: { fontSize: 40, fontWeight: '800', color: colors.text, lineHeight: 44 },
  label: { color: colors.muted, fontSize: 13 },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.flame },
  message: { color: colors.muted },
});
