import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type CalendarHeatmapProps = {
  activeDates: string[];
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  // 0 = Sunday, convert to Monday-based (0 = Monday)
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export function CalendarHeatmap({ activeDates, year, month, onMonthChange }: CalendarHeatmapProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const activeSet = new Set(activeDates);
  const today = new Date().toISOString().split('T')[0];

  const prevMonth = () => {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  };

  const nextMonth = () => {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  };

  // Build grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth} style={styles.arrow}>
          <ThemedText style={styles.arrowText}>&#8249;</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.monthTitle}>
          {MONTH_NAMES[month - 1]} {year}
        </ThemedText>
        <TouchableOpacity onPress={nextMonth} style={styles.arrow}>
          <ThemedText style={styles.arrowText}>&#8250;</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Day labels */}
      <View style={styles.row}>
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={styles.cell}>
            <ThemedText style={[styles.dayLabel, { color: Colors[colorScheme].icon }]}>
              {label}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Day grid */}
      {Array.from({ length: cells.length / 7 }, (_, weekIdx) => (
        <View key={weekIdx} style={styles.row}>
          {cells.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, dayIdx) => {
            if (day === null) {
              return <View key={dayIdx} style={styles.cell} />;
            }

            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isActive = activeSet.has(dateStr);
            const isToday = dateStr === today;

            return (
              <View key={dayIdx} style={styles.cell}>
                <View
                  style={[
                    styles.dayCircle,
                    isActive && { backgroundColor: Colors[colorScheme].tint },
                    isToday && !isActive && styles.todayBorder,
                    isToday && !isActive && { borderColor: Colors[colorScheme].icon },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.dayText,
                      isActive && styles.activeText,
                      !isActive && { color: Colors[colorScheme].icon },
                    ]}
                  >
                    {day}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </View>
      ))}
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
    marginBottom: 12,
  },
  arrow: {
    padding: 8,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: '300',
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
    fontSize: 12,
    fontWeight: '500',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayBorder: {
    borderWidth: 1,
  },
  dayText: {
    fontSize: 13,
  },
  activeText: {
    color: '#fff',
    fontWeight: '600',
  },
});
