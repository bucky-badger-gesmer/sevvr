import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type CalendarHeatmapProps = {
  activeDates: string[];
  year: number;
  month: number;
  selectedDate?: string | null;
  onMonthChange: (year: number, month: number) => void;
  onDayPress?: (dateStr: string) => void;
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const BOTANICAL_SYMBOLS = ['·', '🌱', '🌿', '🌸'];
const BOTANICAL_COLORS = ['#8FA88B', '#A3B894', '#C67D5E', '#D4A853'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function getActivityLevel(dateStr: string, activeDates: string[]): number {
  const count = activeDates.filter(d => d === dateStr).length;
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

export function CalendarHeatmap({ activeDates, year, month, selectedDate, onMonthChange, onDayPress }: CalendarHeatmapProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const activeSet = new Set(activeDates);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const prevMonth = () => {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  };

  const nextMonth = () => {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getSeasonalEmoji = (level: number): string => {
    if (level === 0) return '';
    return BOTANICAL_SYMBOLS[Math.min(level, 3)];
  };

  const getActivityColor = (level: number): string => {
    if (level === 0) return 'transparent';
    return BOTANICAL_COLORS[Math.min(level, 3)] + '30';
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth} style={styles.arrow} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ThemedText style={styles.arrowText}>‹</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.monthTitle}>
          {MONTH_NAMES[month - 1]} {year}
        </ThemedText>
        <TouchableOpacity onPress={nextMonth} style={styles.arrow} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ThemedText style={styles.arrowText}>›</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={styles.cell}>
            <ThemedText style={[styles.dayLabel, { color: colors.muted }]}>
              {label}
            </ThemedText>
          </View>
        ))}
      </View>

      <Animated.View 
        key={`${year}-${month}`}
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
      >
        {Array.from({ length: cells.length / 7 }, (_, weekIdx) => (
          <View key={weekIdx} style={styles.row}>
            {cells.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, dayIdx) => {
              if (day === null) {
                return <View key={dayIdx} style={styles.cell} />;
              }

              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isActive = activeSet.has(dateStr);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;
              const activityLevel = getActivityLevel(dateStr, activeDates);

              return (
                <View key={dayIdx} style={styles.cell}>
                  <TouchableOpacity
                    style={[
                      styles.dayCircle,
                      { backgroundColor: getActivityColor(activityLevel) },
                      isToday && !isSelected && { borderColor: colors.tint, borderWidth: 1.5 },
                      isSelected && { backgroundColor: colors.tint, borderColor: colors.tint, borderWidth: 2 },
                    ]}
                    onPress={() => onDayPress?.(dateStr)}
                    disabled={!isActive && !isToday}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[
                        styles.dayText,
                        isActive && !isSelected && { color: colors.text },
                        !isActive && { color: colors.muted },
                        isSelected && { color: '#fff', fontWeight: '600' },
                      ]}
                    >
                      {day}
                    </ThemedText>
                    {isActive && !isSelected && (
                      <ThemedText style={styles.botanicalSymbol}>
                        {getSeasonalEmoji(activityLevel)}
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ))}
      </Animated.View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BOTANICAL_COLORS[0] }]} />
          <ThemedText style={[styles.legendText, { color: colors.muted }]}>Seed</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BOTANICAL_COLORS[1] }]} />
          <ThemedText style={[styles.legendText, { color: colors.muted }]}>Sprout</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BOTANICAL_COLORS[2] }]} />
          <ThemedText style={[styles.legendText, { color: colors.muted }]}>Leaf</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BOTANICAL_COLORS[3] }]} />
          <ThemedText style={[styles.legendText, { color: colors.muted }]}>Bloom</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  arrow: {
    padding: 8,
  },
  arrowText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#666',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
  },
  botanicalSymbol: {
    position: 'absolute',
    bottom: 2,
    fontSize: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E0D8',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});