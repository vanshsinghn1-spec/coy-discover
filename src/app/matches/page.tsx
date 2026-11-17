'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Compass, Sparkles, MessageCircle } from 'lucide-react';
import TopHeader from '@/components/TopHeader';
import { Profile } from '@/types';
import styles from './page.module.css';

export default function MatchesPage() {
  const [matches, setMatches] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      try {
        setLoading(true);
        const res = await fetch('/api/matches', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load matches');
        const data = await res.json();
        setMatches(data);
      } catch (err) {
        console.error('Error loading matches:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  return (
    <>
      <TopHeader />

      <div className={styles.container}>
        <div className={styles.headerSection}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Matches</h1>
            <span className={styles.counter}>{matches.length}</span>
          </div>
          <p className={styles.subtitle}>
            Mutual crushes only. Coy never reveals a like unless both of you swiped right.
          </p>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.skeletonRow} />
            <div className={styles.skeletonRow} />
            <div className={styles.skeletonRow} />
          </div>
        ) : matches.length === 0 ? (
          <div className={styles.emptyContainer}>
            <div className={styles.emptyIconBox}>
              <Sparkles size={36} color="var(--pink)" />
            </div>
            <h2 className={styles.emptyTitle}>No matches yet</h2>
            <p className={styles.emptyText}>
              Keep exploring on the Discover tab. When you and someone else both like each other, they will appear right here!
            </p>
            <Link href="/discover" className="btn" style={{ width: '100%', maxWidth: '280px' }}>
              <Compass size={18} />
              Start Swiping
            </Link>
          </div>
        ) : (
          <div className={styles.list}>
            {matches.map((match) => (
              <div key={match.id} className={styles.matchCard}>
                <div className={styles.avatarWrapper}>
                  <Image
                    src={match.photo}
                    alt={match.name}
                    width={56}
                    height={56}
                    className={styles.avatarImg}
                  />
                  <div className={styles.avatarDot} />
                </div>

                <div className={styles.info}>
                  <div className={styles.nameRow}>
                    <h3 className={styles.name}>{match.name}, {match.age}</h3>
                    <span className={styles.matchedBadge}>Mutual</span>
                  </div>
                  <p className={styles.location}>{match.location}</p>
                  <p className={styles.bio}>{match.bio}</p>
                </div>

                <div className={styles.action}>
                  <button
                    type="button"
                    className={styles.sayHiBtn}
                    onClick={() => alert(`Say hi to ${match.name}! (In Coy, conversations take place off-platform or via mutual reveal)`)}
                    title={`Say hi to ${match.name}`}
                  >
                    <MessageCircle size={18} strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
