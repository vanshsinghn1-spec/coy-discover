'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import { Profile } from '@/types';
import ProfileCard from './ProfileCard';
import styles from './SwipeStack.module.css';

interface SwipeStackProps {
  profiles: Profile[];
  onSwipe: (profileId: number, action: 'like' | 'pass') => Promise<{ matched: boolean; matchedProfile?: Profile }>;
  onMatch: (profile: Profile) => void;
}

export default function SwipeStack({ profiles, onSwipe, onMatch }: SwipeStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragDirection, setDragDirection] = useState<'like' | 'pass' | null>(null);

  const activeProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);

  const handleDrag = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > 45) {
      setDragDirection('like');
    } else if (info.offset.x < -45) {
      setDragDirection('pass');
    } else {
      setDragDirection(null);
    }
  };

  const triggerSwipe = async (action: 'like' | 'pass') => {
    if (!activeProfile || isAnimating) return;

    setIsAnimating(true);
    const profileToSwipe = activeProfile;

    try {
      const result = await onSwipe(profileToSwipe.id, action);
      setCurrentIndex((prev) => prev + 1);
      setDragDirection(null);
      setIsAnimating(false);

      if (result.matched && (result.matchedProfile || profileToSwipe)) {
        onMatch(result.matchedProfile || profileToSwipe);
      }
    } catch (err) {
      console.error('Swipe error:', err);
      setIsAnimating(false);
      setDragDirection(null);
    }
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (isAnimating) return;

    const threshold = 90;
    const velocityThreshold = 400;

    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      triggerSwipe('like');
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      triggerSwipe('pass');
    } else {
      setDragDirection(null);
    }
  };

  if (!activeProfile) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.deck}>
        {/* Next Card in Stack (Behind) */}
        {nextProfile && (
          <div className={styles.backgroundCardWrapper}>
            <ProfileCard profile={nextProfile} />
          </div>
        )}

        {/* Top Active Card (Swipable) */}
        <AnimatePresence>
          <motion.div
            key={activeProfile.id}
            className={styles.foregroundCardWrapper}
            style={{ x, rotate }}
            drag={isAnimating ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            animate={
              isAnimating
                ? dragDirection === 'like'
                  ? { x: 500, opacity: 0, rotate: 25 }
                  : { x: -500, opacity: 0, rotate: -25 }
                : { x: 0, opacity: 1 }
            }
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <ProfileCard
              profile={activeProfile}
              swipeFeedback={dragDirection}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons for Desktop & Tap Control */}
      <div className={styles.controls} aria-label="Swipe actions">
        <button
          type="button"
          onClick={() => {
            setDragDirection('pass');
            triggerSwipe('pass');
          }}
          disabled={isAnimating}
          className={`${styles.actionBtn} ${styles.passBtn}`}
          title="Pass (Swipe Left)"
          aria-label="Pass"
        >
          <X size={28} strokeWidth={3} />
        </button>

        <button
          type="button"
          onClick={() => {
            setDragDirection('like');
            triggerSwipe('like');
          }}
          disabled={isAnimating}
          className={`${styles.actionBtn} ${styles.likeBtn}`}
          title="Like (Swipe Right)"
          aria-label="Like"
        >
          <Heart size={28} strokeWidth={2.8} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
