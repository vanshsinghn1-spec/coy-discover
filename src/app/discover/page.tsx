'use client';

import React, { useEffect, useState, useCallback } from 'react';
import TopHeader from '@/components/TopHeader';
import SwipeStack from '@/components/SwipeStack';
import MatchModal from '@/components/MatchModal';
import EmptyState from '@/components/EmptyState';
import { Profile, SwipeResponse } from '@/types';
import styles from './page.module.css';

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/feed', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load feed');
      const data = await res.json();
      setProfiles(data);
    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleSwipe = async (
    profileId: number,
    action: 'like' | 'pass'
  ): Promise<{ matched: boolean; matchedProfile?: Profile }> => {
    try {
      const res = await fetch('/api/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, action }),
      });

      if (!res.ok) throw new Error('Failed to record swipe');
      const data = (await res.json()) as SwipeResponse;

      // Filter out swiped profile locally
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));

      return {
        matched: data.matched,
        matchedProfile: data.matchedProfile || undefined,
      };
    } catch (err) {
      console.error('Swipe error:', err);
      return { matched: false };
    }
  };

  const handleReset = async () => {
    try {
      setIsResetting(true);
      await fetch('/api/reset', { method: 'POST' });
      await fetchFeed();
    } catch (err) {
      console.error('Error resetting:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <TopHeader onReset={handleReset} showReset={true} />

      <div className={styles.container}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.skeletonCard}>
              <div className={styles.skeletonImage} />
              <div className={styles.skeletonText} />
              <div className={styles.skeletonLine} />
            </div>
            <p className={styles.loadingText}>Finding interesting people...</p>
          </div>
        ) : profiles.length === 0 ? (
          <EmptyState onReset={handleReset} isResetting={isResetting} />
        ) : (
          <SwipeStack
            profiles={profiles}
            onSwipe={handleSwipe}
            onMatch={(matched) => setMatchedProfile(matched)}
          />
        )}
      </div>

      {/* "It's a Match!" Celebration Screen */}
      <MatchModal
        matchedProfile={matchedProfile}
        onClose={() => setMatchedProfile(null)}
      />
    </>
  );
}
