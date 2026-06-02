/**
 * Dashboard home page route.
 * Enhanced with animations and improved visual design.
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { WelcomePanel } from '@/components/dashboard/welcome-panel';
import { StatsRow } from '@/components/dashboard/stats-row';
import { RecentGenerations } from '@/components/dashboard/recent-generations';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

export default function DashboardPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-8 pb-10"
    >
      <motion.div variants={itemVariants}>
        <WelcomePanel />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <StatsRow />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <RecentGenerations />
      </motion.div>
      
    </motion.div>
  );
}