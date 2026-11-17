import React from 'react';
import Link from 'next/link';
import { Home as HomeIcon, Compass } from 'lucide-react';
import TopHeader from '@/components/TopHeader';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <>
      <TopHeader />
      <div className={styles.container}>
        <div className={styles.placeholderBox}>
          <div className={styles.iconMark}>
            <HomeIcon size={36} strokeWidth={2.2} />
          </div>
          <h1 className={styles.title}>Home</h1>
          <p className={styles.subtitle}>
            This placeholder represents Coy&apos;s existing home view as per the assignment instructions.
          </p>
          <Link href="/discover" className="btn">
            <Compass size={18} strokeWidth={2.4} />
            Go to Discover
          </Link>
        </div>
      </div>
    </>
  );
}
