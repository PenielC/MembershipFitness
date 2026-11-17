import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { GymClass } from '../api/types';
import { useBookClass, useBookings, useClasses, useGyms, useMember } from '../api/hooks';
import { ClassCard } from '../components/ClassCard';
import { ErrorState, FeedbackBanner, Loading } from '../components/ui';
import { dayKey, errorMessage, formatDay } from '../format';
import { colors } from '../theme';
import { useFeedback } from '../useFeedback';

interface DaySection {
  title: string;
  data: GymClass[];
}

export function upcomingOnly(classes: readonly GymClass[], nowMs: number): GymClass[] {
  return classes.filter((c) => new Date(c.startsAt).getTime() > nowMs);
}

export function groupByDay(classes: readonly GymClass[]): DaySection[] {
  const sorted = [...classes].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const sections = new Map<string, DaySection>();
  for (const c of sorted) {
    const key = dayKey(c.startsAt);
    const section = sections.get(key) ?? { title: formatDay(c.startsAt), data: [] };
    section.data.push(c);
    sections.set(key, section);
  }
  return [...sections.values()];
}

export function ClassBookingScreen() {
  const member = useMember();
  const gyms = useGyms();
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const gymId = picked ?? member.data?.preferredGymId;
  const classes = useClasses(gymId);
  const bookings = useBookings();
  const book = useBookClass();
  const [feedback, showFeedback] = useFeedback();
  const [bookingId, setBookingId] = useState<string | null>(null);

  const bookedIds = useMemo(() => new Set(bookings.data?.bookings.map((b) => b.class.id)), [bookings.data]);
  // Classes that have already started can't be booked, so don't offer them.
  const sections = useMemo(() => groupByDay(upcomingOnly(classes.data?.classes ?? [], Date.now())), [classes.data]);

  const failed = [member, gyms, classes].find((q) => q.isError);
  if (failed?.error) {
    return <ErrorState message={errorMessage(failed.error)} onRetry={() => void Promise.all([member.refetch(), gyms.refetch(), classes.refetch()])} />;
  }
  if (!gymId || !gyms.data || !classes.data) return <Loading />;

  const onBook = (classId: string) => {
    setBookingId(classId);
    book.mutate(classId, {
      onSuccess: (r) => showFeedback({ kind: 'success', message: `Booked ${r.class.name}! See you there.` }),
      onError: (e) => showFeedback({ kind: 'error', message: errorMessage(e) }),
      onSettled: () => setBookingId(null),
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title}>Classes</Text>
      <View style={styles.chips}>
        {gyms.data.gyms.map((g) => (
          <Pressable
            key={g.id}
            accessibilityRole="button"
            accessibilityState={{ selected: g.id === gymId }}
            onPress={() => setPicked(g.id)}
            style={[styles.chip, g.id === gymId && styles.chipOn]}
          >
            <Text style={[styles.chipText, g.id === gymId && { color: colors.onPrimary }]}>{g.name}</Text>
          </Pressable>
        ))}
      </View>
      <FeedbackBanner feedback={feedback} />
      <SectionList
        sections={sections}
        keyExtractor={(c) => c.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={classes.isRefetching} onRefresh={() => void classes.refetch()} />}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => <ClassCard gymClass={item} alreadyBooked={bookedIds.has(item.id)} busy={bookingId === item.id} onBook={onBook} />}
        ListEmptyComponent={<Text style={styles.empty}>No classes scheduled at this gym.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, paddingHorizontal: 16, paddingTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: colors.muted, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, textTransform: 'uppercase' },
  empty: { textAlign: 'center', color: colors.muted, padding: 24 },
});
