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
import { useAuth } from '@/hooks/use-auth';
import { useSession } from '@/hooks/use-session';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as socialService from '@/lib/social-service';
import * as leaderboardService from '@/lib/leaderboard-service';
import * as challengeService from '@/lib/challenge-service';
import type { LeaderboardEntry, Friend, FriendRequest, Challenge } from '@/types/social';

type Tab = 'friends-lb' | 'global-lb' | 'friends' | 'challenges';

export default function SocialScreen() {
  const { user } = useAuth();
  const { dispatch: sessionDispatch } = useSession();
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('friends-lb');

  // Leaderboard state
  const [friendsLB, setFriendsLB] = useState<LeaderboardEntry[]>([]);
  const [globalLB, setGlobalLB] = useState<LeaderboardEntry[]>([]);

  // Friends state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);

  // Challenges state
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

  // Debounced search
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

  const TabButton = ({ id, label }: { id: Tab; label: string }) => (
    <TouchableOpacity
      style={[styles.tabBtn, tab === id && { backgroundColor: Colors[colorScheme].tint }]}
      onPress={() => setTab(id)}
    >
      <ThemedText style={[styles.tabText, tab === id && styles.tabTextActive]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TabButton id="friends-lb" label="Friends" />
        <TabButton id="global-lb" label="Global" />
        <TabButton id="challenges" label="Challenges" />
        <TabButton id="friends" label="Manage" />
      </View>

      {/* Friends Leaderboard */}
      {tab === 'friends-lb' && (
        <FlatList
          data={friendsLB}
          renderItem={({ item }) => <LeaderboardRow entry={item} />}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText style={styles.empty}>Add friends to see your leaderboard!</ThemedText>
          }
        />
      )}

      {/* Global Leaderboard */}
      {tab === 'global-lb' && (
        <FlatList
          data={globalLB}
          renderItem={({ item }) => <LeaderboardRow entry={item} />}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText style={styles.empty}>No one has severed this week yet!</ThemedText>
          }
        />
      )}

      {/* Challenges */}
      {tab === 'challenges' && (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.challengeActions}>
                <TouchableOpacity
                  style={[styles.challengeBtn, { backgroundColor: Colors[colorScheme].tint }]}
                  onPress={() => setShowFriendPicker(!showFriendPicker)}
                >
                  <ThemedText style={styles.challengeBtnText}>Challenge a Friend</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.challengeBtn, styles.challengeBtnOutline, { borderColor: Colors[colorScheme].tint }]}
                  onPress={handleSmsInvite}
                >
                  <ThemedText style={[styles.challengeBtnText, { color: Colors[colorScheme].tint }]}>
                    Invite via SMS
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {showFriendPicker && (
                <View style={styles.friendPicker}>
                  <ThemedText style={styles.sectionTitle}>Pick a friend to challenge</ThemedText>
                  {friends.length === 0 ? (
                    <ThemedText style={styles.empty}>Add friends first!</ThemedText>
                  ) : (
                    friends.map((friend) => (
                      <View key={friend.id} style={styles.searchRow}>
                        <ThemedText>@{friend.username}</ThemedText>
                        <TouchableOpacity
                          style={[styles.addBtn, { backgroundColor: Colors[colorScheme].tint }]}
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
              <ThemedText style={styles.empty}>No active challenges. Challenge a friend!</ThemedText>
            ) : null
          }
        />
      )}

      {/* Friends Management */}
      {tab === 'friends' && (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* Pending requests */}
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

              {/* Search */}
              <TextInput
                style={[styles.searchInput, {
                  color: Colors[colorScheme].text,
                  borderColor: Colors[colorScheme].icon,
                }]}
                placeholder="Search by username..."
                placeholderTextColor={Colors[colorScheme].icon}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />

              {/* Search results */}
              {searchResults.map((result) => (
                <View key={result.id} style={styles.searchRow}>
                  <ThemedText>@{result.username}</ThemedText>
                  <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: Colors[colorScheme].tint }]}
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
            <View style={styles.friendRow}>
              <View style={styles.friendAvatar}>
                <ThemedText style={styles.friendAvatarText}>
                  {(item.username[0] ?? '?').toUpperCase()}
                </ThemedText>
              </View>
              <ThemedText>@{item.username}</ThemedText>
            </View>
          )}
          ListEmptyComponent={
            searchQuery.length === 0 ? (
              <ThemedText style={styles.empty}>
                Search for friends by username above
              </ThemedText>
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
    marginBottom: 12,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  empty: {
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 40,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  addBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  friendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  challengeActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
    marginTop: 4,
  },
  challengeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
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
