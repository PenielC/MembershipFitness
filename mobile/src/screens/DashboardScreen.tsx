import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBookings, useCheckIn, useMember, useStats } from '../api/hooks';
import { StreakCard } from '../components/StreakCard';
import { Badge, ErrorState, FeedbackBanner, Loading } from '../components/ui';
import { errorMessage, formatDay, formatTime } from '../format';
import { colors, tierColors, typeColors } from '../theme';
import { useFeedback } from '../useFeedback';

function StatCard({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, small && styles.statValueSmall]} numberOfLines={2}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function DashboardScreen() {
  const member = useMember();
  const stats = useStats();
  const bookings = useBookings();
  const checkIn = useCheckIn();
  const [feedback, showFeedback] = useFeedback();

  const queries = [member, stats, bookings];
  const failed = queries.find((q) => q.isError);
  const refetchAll = () => Promise.all(queries.map((q) => q.refetch()));

  if (failed?.error) return <ErrorState message={errorMessage(failed.error)} onRetry={() => void refetchAll()} />;
  if (!member.data || !stats.data || !bookings.data) return <Loading />;

  const { data: m } = member;
  const s = stats.data;
  const next = bookings.data.bookings.slice(0, 3);

  const onCheckIn = () =>
    checkIn.mutate(m.homeGymId, {
      onSuccess: (r) => showFeedback({ kind: 'success', message: `Checked in at ${m.homeGym.name}! Streak: ${r.streak} ${r.streak === 1 ? 'day' : 'days'}.` }),
      onError: (e) => showFeedback({ kind: 'error', message: errorMessage(e) }),
    });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={queries.some((q) => q.isRefetching)} onRefresh={() => void refetchAll()} />}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hi, {m.name.split(' ')[0]} 👋</Text>
            <Text style={styles.muted}>{m.homeGym.name}</Text>
          </View>
          <Badge label={m.tier} bg={tierColors[m.tier].bg} fg={tierColors[m.tier].fg} />
        </View>

        <StreakCard streak={s.currentStreak} />

        <View style={styles.statsRow}>
          <StatCard label="Visits this month" value={String(s.visitsThisMonth)} />
          <StatCard label="Classes booked" value={String(s.upcomingBookings)} />
          <StatCard small label="Favorite gym" value={s.favoriteGym?.name ?? '—'} />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={checkIn.isPending}
          onPress={onCheckIn}
          style={[styles.checkIn, checkIn.isPending && { opacity: 0.6 }]}
        >
          <Text style={styles.checkInText}>{checkIn.isPending ? 'Checking in…' : `Check in at ${m.homeGym.name}`}</Text>
        </Pressable>
        <FeedbackBanner feedback={feedback} />

        <Text style={styles.sectionTitle}>Upcoming bookings</Text>
        {next.length === 0 ? (
          <Text style={styles.muted}>No upcoming classes. Head to the Classes tab to book one.</Text>
        ) : (
          next.map(({ class: c }) => (
            <View key={c.id} style={styles.booking}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookingName}>{c.name}</Text>
                <Text style={styles.muted}>
                  {formatDay(c.startsAt)} · {formatTime(c.startsAt)} · {c.instructor}
                </Text>
              </View>
              <Badge label={typeColors[c.type].label} bg={typeColors[c.type].bg} fg={typeColors[c.type].fg} />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: { fontSize: 24, fontWeight: '800', color: colors.text },
  muted: { color: colors.muted },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border, gap: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  statValueSmall: { fontSize: 14, lineHeight: 20 },
  statLabel: { fontSize: 12, color: colors.muted },
  checkIn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  checkInText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 6 },
  booking: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
  bookingName: { fontWeight: '700', color: colors.text },
});
