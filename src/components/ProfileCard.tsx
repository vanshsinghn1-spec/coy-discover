'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { Profile } from '@/types';
import styles from './ProfileCard.module.css';

interface ProfileCardProps {
  profile: Profile;
  swipeFeedback?: 'like' | 'pass' | null;
}

const PASTEL_COLORS = [
  'var(--lilac)',
  'var(--mint)',
  'var(--peach)',
  'var(--sky)',
  'var(--yellow)',
  'var(--pink-soft)',
];

export default function ProfileCard({ profile, swipeFeedback }: ProfileCardProps) {
  return (
    <div className={styles.card}>
      {/* Swipe Feedback Stamp */}
      {swipeFeedback === 'like' && (
        <div className={`${styles.stamp} ${styles.likeStamp}`}>LIKE</div>
      )}
      {swipeFeedback === 'pass' && (
        <div className={`${styles.stamp} ${styles.passStamp}`}>PASS</div>
      )}

      {/* Image Container */}
      <div className={styles.imageContainer}>
        <Image
          src={profile.photo}
          alt={profile.name}
          fill
          sizes="(max-width: 480px) 100vw, 440px"
          priority
          className={styles.image}
        />
        <div className={styles.imageGradient} />
        
        {/* Name and age placed over the bottom of image */}
        <div className={styles.imageOverlayText}>
          <div className={styles.nameRow}>
            <h2 className={styles.name}>{profile.name}</h2>
            <span className={styles.age}>{profile.age}</span>
          </div>
          <div className={styles.location}>
            <MapPin size={15} strokeWidth={2.4} />
            <span>{profile.location}</span>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className={styles.details}>
        <p className={styles.bio}>{profile.bio}</p>

        {/* Interests Pills */}
        {profile.interests && profile.interests.length > 0 && (
          <div className={styles.interests}>
            {profile.interests.map((interest, idx) => (
              <span
                key={interest}
                className={styles.pill}
                style={{
                  backgroundColor: PASTEL_COLORS[idx % PASTEL_COLORS.length],
                }}
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
