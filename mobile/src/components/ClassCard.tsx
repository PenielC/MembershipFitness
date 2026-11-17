import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { GymClass } from '../api/types';
import { formatSpots, formatTime } from '../format';
import { colors, typeColors } from '../theme';
import { Badge } from './ui';

interface Props {
  gymClass: GymClass;
  alreadyBooked: boolean;
  busy: boolean;
  onBook: (classId: string) => void;
}

export function ClassCard({ gymClass, alreadyBooked, busy, onBook }: Props) {
  const t = typeColors[gymClass.type];
  const disabled = gymClass.isFull || alreadyBooked || busy;
  const label = alreadyBooked ? 'Booked' : gymClass.isFull ? 'Full' : busy ? 'Booking…' : 'Book';

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{gymClass.name}</Text>
          <Badge label={t.label} bg={t.bg} fg={t.fg} />
        </View>
        <Text style={styles.muted}>
          {gymClass.instructor} · {formatTime(gymClass.startsAt)} · {gymClass.durationMinutes} min
        </Text>
        <Text style={[styles.spots, gymClass.isFull && { color: colors.danger }]}>
          {formatSpots(gymClass.booked, gymClass.capacity)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} ${gymClass.name}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => onBook(gymClass.id)}
        style={[styles.button, disabled && styles.buttonDisabled]}
      >
        <Text style={[styles.buttonText, disabled && { color: colors.muted }]}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, fontSize: 13 },
  spots: { color: colors.text, fontSize: 13, fontWeight: '600' },
  button: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, minWidth: 76, alignItems: 'center' },
  buttonDisabled: { backgroundColor: colors.disabled },
  buttonText: { color: colors.onPrimary, fontWeight: '700' },
});
