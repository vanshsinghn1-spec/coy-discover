'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Heart } from 'lucide-react';
import styles from './TabBar.module.css';

export default function TabBar() {
  const pathname = usePathname();

  const isHome = pathname === '/home';
  const isDiscover = pathname === '/discover' || pathname === '/';
  const isMatches = pathname === '/matches';

  return (
    <nav className={styles.tabBar} aria-label="Bottom Navigation">
      <div className={styles.inner}>
        <Link
          href="/home"
          className={`${styles.tab} ${isHome ? styles.active : ''}`}
          aria-current={isHome ? 'page' : undefined}
        >
          <Home size={22} strokeWidth={isHome ? 2.5 : 2} />
          <span className={styles.label}>Home</span>
        </Link>

        <Link
          href="/discover"
          className={`${styles.tab} ${isDiscover ? styles.active : ''}`}
          aria-current={isDiscover ? 'page' : undefined}
        >
          <div className={styles.iconWrapper}>
            <Compass size={22} strokeWidth={isDiscover ? 2.5 : 2} />
            {isDiscover && <span className={styles.activeDot} />}
          </div>
          <span className={styles.label}>Discover</span>
        </Link>

        <Link
          href="/matches"
          className={`${styles.tab} ${isMatches ? styles.active : ''}`}
          aria-current={isMatches ? 'page' : undefined}
        >
          <Heart size={22} strokeWidth={isMatches ? 2.5 : 2} />
          <span className={styles.label}>Matches</span>
        </Link>
      </div>
    </nav>
  );
}
