'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Sparkles } from 'lucide-react';
import { Profile } from '@/types';
import styles from './MatchModal.module.css';

interface MatchModalProps {
  matchedProfile: Profile | null;
  onClose: () => void;
}

export default function MatchModal({ matchedProfile, onClose }: MatchModalProps) {
  if (!matchedProfile) return null;

  // Floating decorative icon particles
  const burstParticles = [
    { left: '14%', delay: '0s', type: 'heart', size: 24 },
    { left: '30%', delay: '0.4s', type: 'sparkle', size: 20 },
    { left: '48%', delay: '0.1s', type: 'heart', size: 28 },
    { left: '68%', delay: '0.5s', type: 'sparkle', size: 22 },
    { left: '84%', delay: '0.2s', type: 'heart', size: 20 },
    { left: '24%', delay: '0.8s', type: 'heart', size: 22 },
    { left: '76%', delay: '0.7s', type: 'sparkle', size: 26 },
  ];

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      {/* Floating Burst particles */}
      <div className={styles.burst}>
        {burstParticles.map((p, i) => (
          <span
            key={i}
            className={styles.particle}
            style={{
              left: p.left,
              animationDelay: p.delay,
            }}
          >
            {p.type === 'heart' ? (
              <Heart size={p.size} fill="#ffffff" color="#ffffff" />
            ) : (
              <Sparkles size={p.size} color="#ffffff" />
            )}
          </span>
        ))}
      </div>

      <div className={styles.revealInner}>
        {/* Pair Avatars */}
        <div className={styles.pair}>
          <div className={styles.avatarWrapper}>
            <Image
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80"
              alt="You"
              width={84}
              height={84}
              className={styles.avatarImg}
            />
          </div>

          <div className={styles.pairHeart}>
            <Heart size={20} strokeWidth={2.5} fill="currentColor" color="#ffffff" />
          </div>

          <div className={styles.avatarWrapper}>
            <Image
              src={matchedProfile.photo}
              alt={matchedProfile.name}
              width={84}
              height={84}
              className={styles.avatarImg}
            />
          </div>
        </div>

        {/* Match Title & Copy */}
        <h2 className={styles.title}>It&apos;s a match!</h2>
        <p className={styles.lede}>
          You and <strong>{matchedProfile.name}</strong> both like each other.
        </p>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <Link href="/matches" className={`${styles.btn} ${styles.btnMatches}`}>
            View Matches
          </Link>
          <button type="button" onClick={onClose} className={`${styles.btn} ${styles.btnKeepSwiping}`}>
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
}
