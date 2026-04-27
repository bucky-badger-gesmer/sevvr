import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, View, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LeaderboardRow } from '@/components/leaderboard-row';
import { FriendRequestCard } from '@/components/friend-request-card';
import { ChallengeCard } from '@/components/challenge-card';
import { BotanicalEmptyState } from '@/components/botanical-empty-state';
import { useAuth } from '@/hooks/use-auth';
import { useSession } from '@/hooks/use-session';
import { Colors, BorderRadius, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as socialService from '@/lib/social-service';
import * as leaderboardService from '@/lib/leaderboard-service';
import * as challengeService from '@/lib/challenge-service';
import type { LeaderboardEntry, Friend, FriendRequest, Challenge } from '@/types/social';

type Tab = 'friends-lb' | 'global-lb' | 'friends' | 'challenges';

function TabButton({ id, label, active, onPress }: { id: Tab; label: string; active: boolean; onPress: (id: Tab) => void }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity
      style={[
        styles.tabBtn,
        active && { backgroundColor: colors.tint, shadowColor: colors.tint, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      ]}
      onPress={() => onPress(id)}
    >
      <ThemedText style={[styles.tabText, active && { color: '#fff', fontWeight: '600' }]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

export default function SocialScreen() {
  const { user } = useAuth();
  const { dispatch: sessionDispatch } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('friends-lb');

  const [friendsLB, setFriendsLB] = useState<LeaderboardEntry[]>([]);
  const [globalLB, setGlobalLB] = useState<LeaderboardEntry[]>([]);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [showFriendPicker, setShowFriendPicker] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    if (tab === 'friends-lb') {
      const data = await leaderboardService.getFriendsLeaderboard(user.id);
      setFriendsLB(data);
    } else if (tab === 'global-lb') {
      const data = await leaderboardService.getGlobalLeaderboard(user.id);
      setGlobalLB(data);
    } else if (tab === 'challenges') {
      const [challengesData, friendsData] = await Promise.all([
        challengeService.getActiveChallenges(user.id),
        socialService.getFriends(user.id),
      ]);
      setChallenges(challengesData);
      setFriends(friendsData);
    } else {
      const [friendsData, requestsData] = await Promise.all([
        socialService.getFriends(user.id),
        socialService.getPendingRequests(user.id),
      ]);
      setFriends(friendsData);
      setPendingRequests(requestsData);
    }
  }, [user, tab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await socialService.searchUsers(searchQuery);
      setSearchResults(results as Friend[]);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAcceptRequest = async (requestId: string) => {
    await socialService.respondToRequest(requestId, true);
    loadData();
  };

  const handleDeclineRequest = async (requestId: string) => {
    await socialService.respondToRequest(requestId, false);
    loadData();
  };

  const handleAddFriend = async (friendId: string) => {
    await socialService.sendFriendRequest(friendId);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleChallengeFriend = async (friendId: string) => {
    await challengeService.createChallenge(friendId);
    setShowFriendPicker(false);
    loadData();
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    await challengeService.acceptChallenge(challengeId);
    loadData();
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    await challengeService.declineChallenge(challengeId);
    loadData();
  };

  const handleStartChallenge = (challengeId: string) => {
    sessionDispatch({ type: 'SET_CHALLENGE', challengeId });
    router.push('/(tabs)');
  };

  const handleSmsInvite = async () => {
    const challenge = await challengeService.createChallenge(null);
    const inviteUrl = `https://sevvr.app/challenge/${challenge.invite_token}`;
    const message = encodeURIComponent(
      `I challenged you to put your phone down! Download sevvr and see if you can beat me: ${inviteUrl}`
    );
    Linking.openURL(`sms:?body=${message}`);
    loadData();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.tabBar}>
        <TabButton id="friends-lb" label="Friends" active={tab === 'friends-lb'} onPress={setTab} />
        <TabButton id="global-lb" label="Global" active={tab === 'global-lb'} onPress={setTab} />
        <TabButton id="challenges" label="Challenges" active={tab === 'challenges'} onPress={setTab} />
        <TabButton id="friends" label="Manage" active={tab === 'friends'} onPress={setTab} />
      </View>

      {tab === 'friends-lb' && (
        <FlatList
          data={friendsLB}
          renderItem={({ item }) => <LeaderboardRow entry={item} />}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <BotanicalEmptyState icon="🌿" title="Add friends to see your leaderboard!" subtitle="Connect with others to compete" />
          }
        />
      )}

      {tab === 'global-lb' && (
        <FlatList
          data={globalLB}
          renderItem={({ item }) => <LeaderboardRow entry={item} />}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <BotanicalEmptyState icon="🌍" title="No one has severed this week yet!" subtitle="Be the first to go offline" />
          }
        />
      )}

      {tab === 'challenges' && (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.challengeActions}>
                <TouchableOpacity
                  style={[styles.challengeBtn, { backgroundColor: colors.tint }]}
                  onPress={() => setShowFriendPicker(!showFriendPicker)}
                >
                  <ThemedText style={styles.challengeBtnText}>Challenge a Friend</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.challengeBtn, styles.challengeBtnOutline, { borderColor: colors.tint }]}
                  onPress={handleSmsInvite}
                >
                  <ThemedText style={[styles.challengeBtnText, { color: colors.tint }]}>
                    Invite via SMS
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {showFriendPicker && (
                <View style={styles.friendPicker}>
                  <ThemedText style={styles.sectionTitle}>Pick a friend to challenge</ThemedText>
                  {friends.length === 0 ? (
                    <ThemedText style={[styles.empty, { color: colors.muted }]}>Add friends first!</ThemedText>
                  ) : (
                    friends.map((friend) => (
                      <View key={friend.id} style={[styles.searchRow, { borderColor: colors.border }]}>
                        <ThemedText>@{friend.username}</ThemedText>
                        <TouchableOpacity
                          style={[styles.addBtn, { backgroundColor: colors.tint }]}
                          onPress={() => handleChallengeFriend(friend.id)}
                        >
                          <ThemedText style={styles.addBtnText}>Challenge</ThemedText>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              )}

              {challenges.length > 0 && (
                <ThemedText style={styles.sectionTitle}>Active Challenges</ThemedText>
              )}
            </>
          }
          renderItem={({ item }) => (
            <ChallengeCard
              challenge={item}
              currentUserId={user?.id ?? ''}
              onAccept={() => handleAcceptChallenge(item.id)}
              onDecline={() => handleDeclineChallenge(item.id)}
              onStart={() => handleStartChallenge(item.id)}
            />
          )}
          ListEmptyComponent={
            !showFriendPicker ? (
              <BotanicalEmptyState icon="🌿" title="No active challenges" subtitle="Challenge a friend to compete!" />
            ) : null
          }
        />
      )}

      {tab === 'friends' && (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {pendingRequests.length > 0 && (
                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>
                    Pending ({pendingRequests.length})
                  </ThemedText>
                  {pendingRequests.map((req) => (
                    <FriendRequestCard
                      key={req.id}
                      request={req}
                      onAccept={() => handleAcceptRequest(req.id)}
                      onDecline={() => handleDeclineRequest(req.id)}
                    />
                  ))}
                </View>
              )}

              <TextInput
                style={[styles.searchInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                placeholder="Search by username..."
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />

              {searchResults.map((result) => (
                <View key={result.id} style={[styles.searchRow, { borderColor: colors.border }]}>
                  <ThemedText>@{result.username}</ThemedText>
                  <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.tint }]}
                    onPress={() => handleAddFriend(result.id)}
                  >
                    <ThemedText style={styles.addBtnText}>Add</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}

              {friends.length > 0 && (
                <ThemedText style={styles.sectionTitle}>Friends</ThemedText>
              )}
            </>
          }
          renderItem={({ item }) => (
            <View style={[styles.friendRow, { borderColor: colors.border }]}>
              <View style={[styles.friendAvatar, { backgroundColor: colors.tint + '30' }]}>
                <ThemedText style={[styles.friendAvatarText, { color: colors.tint }]}>
                  {(item.username[0] ?? '?').toUpperCase()}
                </ThemedText>
              </View>
              <ThemedText>@{item.username}</ThemedText>
            </View>
          )}
          ListEmptyComponent={
            searchQuery.length === 0 ? (
              <BotanicalEmptyState icon="🔍" title="Search for friends" subtitle="Find friends by username above" />
            ) : null
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  section: {
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: 14,
    fontSize: 15,
    fontFamily: Typography.body.fontFamily,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  addBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: BorderRadius.md,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  challengeActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  challengeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  challengeBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  challengeBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  friendPicker: {
    marginTop: 8,
    marginBottom: 4,
  },
});