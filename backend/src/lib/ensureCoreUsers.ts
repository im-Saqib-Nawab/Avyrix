import bcrypt from 'bcryptjs';
import { SubscriptionStatus, UserRole } from '@prisma/client';
import { config } from '@/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/services/logger.service';

const BCRYPT_ROUNDS = 12;

const CORE_USERS = [
  {
    email: 'admin@avyrix.ai',
    full_name: 'Admin User',
    password: 'Admin@123456',
    role: UserRole.admin,
    credit_balance: 9999,
    subscription_status: SubscriptionStatus.active,
  },
  {
    email: 'test@avyrix.ai',
    full_name: 'Test User',
    password: 'Test@123456',
    role: UserRole.user,
    credit_balance: 100,
    subscription_status: SubscriptionStatus.free,
  },
] as const;

export async function ensureCoreUsers(): Promise<void> {
  const syncPasswords = config.NODE_ENV === 'development';

  for (const coreUser of CORE_USERS) {
    const password_hash = await bcrypt.hash(coreUser.password, BCRYPT_ROUNDS);
    const email = coreUser.email.toLowerCase();

    await prisma.user.upsert({
      where: { email },
      update: syncPasswords
        ? {
            password_hash,
            full_name: coreUser.full_name,
            role: coreUser.role,
            is_verified: true,
          }
        : {},
      create: {
        email,
        full_name: coreUser.full_name,
        password_hash,
        role: coreUser.role,
        credit_balance: coreUser.credit_balance,
        subscription_status: coreUser.subscription_status,
        is_verified: true,
      },
    });
  }

  logger.info('✅ Core users ready: admin@avyrix.ai / Admin@123456, test@avyrix.ai / Test@123456');
}
