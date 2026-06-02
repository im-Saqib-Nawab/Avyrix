import bcrypt from 'bcryptjs';
import { logger } from '../src/services/logger.service';
import {
  GenerationStatus,
  GenerationType,
  PrismaClient,
  SubscriptionStatus,
  TransactionType,
  UserRole,
} from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@avyrix.ai';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@123456';
const SAMPLE_USER_PASSWORD = process.env.SEED_USER_PASSWORD ?? 'Password123!';

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function main(): Promise<void> {
  const passwordHash = await hashPassword(SAMPLE_USER_PASSWORD);
  const adminPasswordHash = await hashPassword(ADMIN_PASSWORD);

  await prisma.creditTransaction.deleteMany();
  await prisma.generation.deleteMany();
  await prisma.project.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.systemLog.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      full_name: 'Alex Morgan',
      email: ADMIN_EMAIL.toLowerCase(),
      password_hash: adminPasswordHash,
      role: UserRole.admin,
      credit_balance: 9999,
      subscription_status: SubscriptionStatus.active,
      is_verified: true,
    },
  });

  const testUserHash = await hashPassword('Test@123456');

  await prisma.user.create({
    data: {
      full_name: 'Test User',
      email: 'test@avyrix.ai',
      password_hash: testUserHash,
      role: UserRole.user,
      credit_balance: 100,
      subscription_status: SubscriptionStatus.free,
      is_verified: true,
    },
  });

  const sampleUsers = await Promise.all([
    prisma.user.create({
      data: {
        full_name: 'Jordan Smith',
        email: 'jordan@example.com',
        password_hash: passwordHash,
        role: UserRole.user,
        credit_balance: 45,
        subscription_status: SubscriptionStatus.free,
        is_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        full_name: 'Sarah Chen',
        email: 'sarah@design.io',
        password_hash: passwordHash,
        role: UserRole.user,
        credit_balance: 890,
        subscription_status: SubscriptionStatus.active,
        is_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        full_name: 'Michael Ross',
        email: 'm.ross@legal.com',
        password_hash: passwordHash,
        role: UserRole.user,
        credit_balance: 12,
        subscription_status: SubscriptionStatus.active,
        is_verified: true,
      },
    }),
  ]);

  const allUsers = [admin, ...sampleUsers];

  for (const user of allUsers) {
    const project = await prisma.project.create({
      data: {
        user_id: user.id,
        name: 'Default Project',
        description: 'Seeded project for development',
      },
    });

    const imageGen = await prisma.generation.create({
      data: {
        user_id: user.id,
        project_id: project.id,
        type: GenerationType.image,
        prompt:
          'A futuristic cityscape at dusk with holographic advertisements, photorealistic',
        parameters: { size: '1024x1024', quality: 'hd', style: 'vivid' },
        status: GenerationStatus.completed,
        api_provider: 'openai',
        media_url:
          'https://images.unsplash.com/photo-1537498425277-c283d32ef9db?w=800',
        thumbnail_url:
          'https://images.unsplash.com/photo-1537498425277-c283d32ef9db?w=400',
        credits_used: 10,
        completed_at: new Date('2026-05-31T08:30:00Z'),
        created_at: new Date('2026-05-31T08:30:00Z'),
      },
    });

    await prisma.generation.create({
      data: {
        user_id: user.id,
        project_id: project.id,
        type: GenerationType.image,
        prompt: 'Abstract digital art, flowing neon light trails on dark background',
        parameters: { size: '1024x1024', quality: 'standard', style: 'natural' },
        status: GenerationStatus.completed,
        api_provider: 'openai',
        media_url:
          'https://images.unsplash.com/photo-1557683316-973673baf926?w=800',
        thumbnail_url:
          'https://images.unsplash.com/photo-1557683316-973673baf926?w=400',
        credits_used: 5,
        completed_at: new Date('2026-05-30T14:00:00Z'),
        created_at: new Date('2026-05-30T14:00:00Z'),
      },
    });

    const videoGen = await prisma.generation.create({
      data: {
        user_id: user.id,
        project_id: project.id,
        type: GenerationType.video,
        prompt: 'Slow motion ocean waves at golden hour, cinematic, 4K',
        parameters: { duration: '5s', aspect_ratio: '16:9' },
        status: GenerationStatus.completed,
        api_provider: 'kling',
        thumbnail_url:
          'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400',
        credits_used: 25,
        completed_at: new Date('2026-05-29T09:15:00Z'),
        created_at: new Date('2026-05-29T09:15:00Z'),
      },
    });

    await prisma.generation.create({
      data: {
        user_id: user.id,
        project_id: project.id,
        type: GenerationType.video,
        prompt: 'Time-lapse of clouds over mountain peaks, dramatic',
        parameters: { duration: '5s', aspect_ratio: '16:9' },
        status: GenerationStatus.failed,
        api_provider: 'kling',
        credits_used: 25,
        credits_refunded: true,
        created_at: new Date('2026-05-29T09:10:00Z'),
      },
    });

    await prisma.generation.create({
      data: {
        user_id: user.id,
        project_id: project.id,
        type: GenerationType.image,
        prompt: 'Portrait of a cyberpunk hacker, neon-lit background, cinematic',
        parameters: { size: '1792x1024', quality: 'hd', style: 'vivid' },
        status: GenerationStatus.processing,
        api_provider: 'openai',
        credits_used: 10,
        created_at: new Date('2026-05-31T09:45:00Z'),
      },
    });

    await prisma.creditTransaction.createMany({
      data: [
        {
          user_id: user.id,
          generation_id: imageGen.id,
          type: TransactionType.deduction,
          amount: -10,
          balance_after: user.credit_balance,
          description: 'Image Generation',
        },
        {
          user_id: user.id,
          generation_id: videoGen.id,
          type: TransactionType.deduction,
          amount: -25,
          balance_after: user.credit_balance,
          description: 'Video Generation',
        },
        {
          user_id: user.id,
          type: TransactionType.topup,
          amount: 100,
          balance_after: user.credit_balance,
          description: 'Welcome bonus credits',
        },
        {
          user_id: user.id,
          type: TransactionType.purchase,
          amount: 500,
          balance_after: user.credit_balance,
          description: 'Pro Pack Purchase',
        },
        {
          user_id: user.id,
          type: TransactionType.refund,
          amount: 25,
          balance_after: user.credit_balance,
          description: 'Refund: Failed Video',
        },
      ],
    });

    if (user.id === admin.id) {
      await prisma.creditTransaction.create({
        data: {
          user_id: user.id,
          type: TransactionType.admin_adjustment,
          amount: 50,
          balance_after: user.credit_balance,
          description: 'Initial admin credits',
          created_by: admin.id,
        },
      });
    }
  }

  await prisma.systemLog.createMany({
    data: [
      {
        level: 'info',
        service: 'seed',
        message: 'Database seeded successfully',
        meta: { admin_email: admin.email, users: allUsers.length },
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    logger.error('Database seed failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    await prisma.$disconnect();
    process.exit(1);
  });
