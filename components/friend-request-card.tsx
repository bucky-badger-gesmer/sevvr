import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { FriendRequest } from '@/types/social';

type FriendRequestCardProps = {
  request: FriendRequest;
  onAccept: () => void;
  onDecline: () => void;
};

export function FriendRequestCard({ request, onAccept, onDecline }: FriendRequestCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <ThemedView style={[styles.card, { borderColor: colors.border }]}>
      <View style={styles.info}>
        <View style={[styles.avatar, { backgroundColor: colors.tint + '30' }]}>
          <ThemedText style={[styles.avatarText, { color: colors.tint }]}>
            {(request.requester.username[0] ?? '?').toUpperCase()}
          </ThemedText>
        </View>
        <View>
          <ThemedText style={styles.username}>@{request.requester.username}</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.muted }]}>
            wants to be friends
          </ThemedText>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: colors.tint }]}
          onPress={onAccept}
        >
          <ThemedText style={styles.btnText}>✓</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.declineBtn, { borderColor: colors.border }]}
          onPress={onDecline}
        >
          <ThemedText style={[styles.declineBtnText, { color: colors.muted }]}>✕</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '600',
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtnText: {
    fontSize: 16,
  },
});