'use client';

import React from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import styles from './TopHeader.module.css';

interface TopHeaderProps {
  onReset?: () => void;
  showReset?: boolean;
}

export default function TopHeader({ onReset, showReset = false }: TopHeaderProps) {
  return (
    <header className={styles.top}>
      <Link href="/discover" className={styles.wordmarkLink}>
        <span className="wordmark">coy</span>
      </Link>

      <div className={styles.actions}>
        {showReset && onReset && (
          <button
            onClick={onReset}
            className={styles.iconBtn}
            title="Reset demo / re-seed"
            aria-label="Reset demo"
          >
            <RotateCcw size={18} strokeWidth={2.4} />
          </button>
        )}
      </div>
    </header>
  );
}
