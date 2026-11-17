'use client';

import React from 'react';
import Link from 'next/link';
import { RotateCcw, Heart, Users } from 'lucide-react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  onReset: () => void;
  isResetting?: boolean;
}

export default function EmptyState({ onReset, isResetting }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.iconCircle}>
        <Users size={36} strokeWidth={2.4} color="var(--text)" />
      </div>

      <h2 className={styles.title}>You&apos;ve seen everyone</h2>
      <p className={styles.description}>
        There are no more new profiles right now. Check your mutual matches or reset the demo to swipe again.
      </p>

      <div className={styles.actions}>
        <Link href="/matches" className="btn" style={{ width: '100%' }}>
          <Heart size={18} fill="currentColor" />
          View Matches
        </Link>

        <button
          type="button"
          onClick={onReset}
          disabled={isResetting}
          className={`btn quiet ${styles.resetBtn}`}
          style={{ width: '100%' }}
        >
          <RotateCcw size={18} strokeWidth={2.4} />
          {isResetting ? 'Resetting...' : 'Reset Demo Profiles'}
        </button>
      </div>
    </div>
  );
}
