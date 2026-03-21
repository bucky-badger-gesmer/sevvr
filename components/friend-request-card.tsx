import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { FriendRequest } from '@/types/social';

type FriendRequestCardProps = {
  request: FriendRequest;
  onAccept: () => void;
  onDecline: () => void;
};

export function FriendRequestCard({ request, onAccept, onDecline }: FriendRequestCardProps) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <ThemedView style={styles.card}>
      <View style={styles.info}>
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>
            {(request.requester.username[0] ?? '?').toUpperCase()}
          </ThemedText>
        </View>
        <View>
          <ThemedText style={styles.username}>@{request.requester.username}</ThemedText>
          <ThemedText style={styles.subtitle}>wants to be friends</ThemedText>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: Colors[colorScheme].tint }]}
          onPress={onAccept}
        >
          <ThemedText style={styles.btnText}>&#10003;</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.declineBtn, { borderColor: Colors[colorScheme].icon }]}
          onPress={onDecline}
        >
          <ThemedText style={styles.declineBtnText}>&#10005;</ThemedText>
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.5,
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
    opacity: 0.6,
  },
});
