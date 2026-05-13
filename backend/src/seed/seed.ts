import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import { Types } from 'mongoose';
import { AppModule } from '../app.module';
import { User } from '../users/schemas/user.schema';
import {
  Workspace,
  PLAN_DEFAULTS,
} from '../workspaces/schemas/workspace.schema';
import { WorkspaceMember } from '../workspaces/schemas/workspace-member.schema';
import { Project } from '../projects/schemas/project.schema';
import { Task } from '../tasks/schemas/task.schema';
import { TaskDependency } from '../dependencies/schemas/task-dependency.schema';
import { CpmService } from '../planning/cpm.service';
import { BillingService } from '../billing/billing.service';
import { Invoice } from '../billing/schemas/invoice.schema';
import { Payment } from '../billing/schemas/payment.schema';
import { Refund } from '../billing/schemas/refund.schema';
import { PlanChangeLog } from '../billing/schemas/plan-change-log.schema';
import { SeatEvent } from '../billing/schemas/seat-event.schema';
import { EnterpriseContract } from '../billing/schemas/enterprise-contract.schema';

const DAY_MS = 86_400_000;

/** Demo workspaces recreated on each `npm run seed` (matched by exact name). */
const DEMO_WORKSPACE_NAMES = [
  'Demo Construction Co.',
  'Demo Software Studio',
  'Örnek Yazılım Stüdyosu',
] as const;

dotenv.config();

async function run() {
  const log = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule);

  const Users = app.get<any>(getModelToken(User.name));
  const Workspaces = app.get<any>(getModelToken(Workspace.name));
  const Members = app.get<any>(getModelToken(WorkspaceMember.name));
  const Projects = app.get<any>(getModelToken(Project.name));
  const Tasks = app.get<any>(getModelToken(Task.name));
  const Deps = app.get<any>(getModelToken(TaskDependency.name));
  const Invoices = app.get<any>(getModelToken(Invoice.name));
  const Payments = app.get<any>(getModelToken(Payment.name));
  const Refunds = app.get<any>(getModelToken(Refund.name));
  const PlanLogs = app.get<any>(getModelToken(PlanChangeLog.name));
  const SeatEvents = app.get<any>(getModelToken(SeatEvent.name));
  const Contracts = app.get<any>(getModelToken(EnterpriseContract.name));
  const cpm = app.get(CpmService);
  const billing = app.get(BillingService);

  log.log('Wiping existing demo data...');
  await Users.deleteMany({ email: { $in: ['owner@demo.local', 'member@demo.local'] } });
  const oldDemo = await Workspaces.find({ name: { $in: DEMO_WORKSPACE_NAMES } }).lean();
  for (const w of oldDemo) {
    const wid = w._id;
    await Promise.all([
      Invoices.deleteMany({ workspaceId: wid }),
      Payments.deleteMany({ workspaceId: wid }),
      Refunds.deleteMany({ workspaceId: wid }),
      PlanLogs.deleteMany({ workspaceId: wid }),
      SeatEvents.deleteMany({ workspaceId: wid }),
      Contracts.deleteMany({ workspaceId: wid }),
      Tasks.deleteMany({ workspaceId: wid }),
      Deps.deleteMany({ workspaceId: wid }),
      Projects.deleteMany({ workspaceId: wid }),
      Members.deleteMany({ workspaceId: wid }),
    ]);
    await Workspaces.deleteOne({ _id: wid });
  }

  log.log('Creating users...');
  const passwordHash = await argon2.hash('Passw0rd!');
  const owner = await Users.create({
    email: 'owner@demo.local',
    passwordHash,
    displayName: 'Demo Owner',
    authProviders: ['local'],
    platformRole: 'platform_admin',
  });
  const member = await Users.create({
    email: 'member@demo.local',
    passwordHash,
    displayName: 'Demo Member',
    authProviders: ['local'],
  });

  log.log('Creating workspace + memberships...');
  await billing.ensureDefaultPlans();
  const proSnap = await billing.getDefaultPlanForTier('pro');
  const ws = await Workspaces.create({
    name: 'Demo Construction Co.',
    ownerId: owner._id,
    plan: 'pro',
    subscriptionPlanId: proSnap ? new Types.ObjectId(proSnap.id) : undefined,
    entitlements: proSnap?.entitlements ?? PLAN_DEFAULTS.pro,
    trialEndsAt: new Date(Date.now() + 5 * DAY_MS),
  });
  await Members.insertMany([
    { workspaceId: ws._id, userId: owner._id, role: 'owner', status: 'active' },
    { workspaceId: ws._id, userId: member._id, role: 'member', status: 'active' },
  ]);
  await billing.recordSeatEvent({
    workspaceId: String(ws._id),
    userId: String(owner._id),
    role: 'owner',
    action: 'added',
    billableAfter: true,
    at: new Date(Date.now() - 60 * DAY_MS),
  });
  await billing.recordSeatEvent({
    workspaceId: String(ws._id),
    userId: String(member._id),
    role: 'member',
    action: 'added',
    billableAfter: true,
    at: new Date(Date.now() - 45 * DAY_MS),
  });

  log.log('Creating software / web workspace + memberships...');
  const wsDev = await Workspaces.create({
    name: 'Örnek Yazılım Stüdyosu',
    ownerId: owner._id,
    plan: 'pro',
    subscriptionPlanId: proSnap ? new Types.ObjectId(proSnap.id) : undefined,
    entitlements: proSnap?.entitlements ?? PLAN_DEFAULTS.pro,
    trialEndsAt: new Date(Date.now() + 5 * DAY_MS),
  });
  await Members.insertMany([
    { workspaceId: wsDev._id, userId: owner._id, role: 'owner', status: 'active' },
    { workspaceId: wsDev._id, userId: member._id, role: 'member', status: 'active' },
  ]);
  await billing.recordSeatEvent({
    workspaceId: String(wsDev._id),
    userId: String(owner._id),
    role: 'owner',
    action: 'added',
    billableAfter: true,
    at: new Date(Date.now() - 30 * DAY_MS),
  });
  await billing.recordSeatEvent({
    workspaceId: String(wsDev._id),
    userId: String(member._id),
    role: 'member',
    action: 'added',
    billableAfter: true,
    at: new Date(Date.now() - 28 * DAY_MS),
  });

  log.log('Seeding billing ledger (demo)...');
  const now = Date.now();
  const invOpen = await Invoices.create({
    invoiceNumber: `INV-DEMO-${String(now).slice(-6)}-O`,
    workspaceId: ws._id,
    status: 'open',
    amountDueFinalUsd: 48,
    issuedAt: new Date(now - 20 * DAY_MS),
    dueAt: new Date(now - 5 * DAY_MS),
    source: 'subscription',
    lineItems: [{ description: 'Pro · 4 seats (prorated)', quantity: 1, unitAmountUsd: 48 }],
  });
  const invPaid = await Invoices.create({
    invoiceNumber: `INV-DEMO-${String(now).slice(-6)}-P`,
    workspaceId: ws._id,
    status: 'paid',
    amountDueFinalUsd: 36,
    issuedAt: new Date(now - 50 * DAY_MS),
    dueAt: new Date(now - 35 * DAY_MS),
    paidAt: new Date(now - 35 * DAY_MS),
    source: 'subscription',
    lineItems: [{ description: 'Pro · 3 seats', quantity: 1, unitAmountUsd: 36 }],
  });
  const payOk = await Payments.create({
    workspaceId: ws._id,
    invoiceId: invPaid._id,
    amountUsd: 36,
    status: 'succeeded',
    method: 'card',
    settledAt: new Date(now - 35 * DAY_MS),
    createdAt: new Date(now - 35 * DAY_MS),
  });
  await Payments.create({
    workspaceId: ws._id,
    invoiceId: invOpen._id,
    amountUsd: 48,
    status: 'failed',
    method: 'card',
    failureMessage: 'card_declined',
    attemptCount: 2,
    nextRetryAt: new Date(now + DAY_MS),
    createdAt: new Date(now - DAY_MS),
  });
  await Payments.create({
    workspaceId: ws._id,
    invoiceId: null,
    amountUsd: 12,
    status: 'succeeded',
    method: 'manual',
    settledAt: new Date(now - 3 * DAY_MS),
    createdAt: new Date(now - 3 * DAY_MS),
  });
  await Refunds.create({
    paymentId: payOk._id,
    workspaceId: ws._id,
    amountUsd: 6,
    status: 'succeeded',
    reason: 'Partial goodwill credit',
  });
  await PlanLogs.create({
    workspaceId: ws._id,
    fromPlanKey: 'free-default',
    toPlanKey: 'pro-default',
    fromTier: 'free',
    toTier: 'pro',
    estimatedMrrBeforeUsd: 0,
    estimatedMrrAfterUsd: 36,
    changedAt: new Date(now - 40 * DAY_MS),
    reason: 'Demo upgrade',
  });

  log.log('Creating project...');
  await Projects.deleteMany({ workspaceId: ws._id });
  const project = await Projects.create({
    workspaceId: ws._id,
    name: 'House Build — Plot 14',
    description: 'Demo project showcasing WBS, dependencies, and CPM.',
    code: 'PLT14',
    status: 'active',
    leadId: owner._id,
    startDate: new Date('2026-05-01T00:00:00.000Z'),
    endDate: new Date('2026-06-30T00:00:00.000Z'),
  });

  log.log('Creating WBS tasks...');
  await Tasks.deleteMany({ projectId: project._id });
  await Deps.deleteMany({ projectId: project._id });

  const D = (s: string) => new Date(s + 'T00:00:00.000Z');
  const mkTask = async (
    over: Partial<{
      title: string;
      parent: Types.ObjectId | null;
      wbs: string;
      start: string;
      end: string;
      duration: number;
      assignees: Types.ObjectId[];
      sortOrder: number;
    }>,
  ) =>
    Tasks.create({
      workspaceId: ws._id,
      projectId: project._id,
      title: over.title!,
      parentTaskId: over.parent ?? null,
      wbsCode: over.wbs,
      startDate: D(over.start!),
      endDate: D(over.end!),
      durationDays: over.duration!,
      status: 'not_started',
      priority: 'medium',
      assigneeIds: over.assignees ?? [],
      sortOrder: over.sortOrder ?? 0,
    });

  const foundation = await mkTask({
    title: '1. Foundation',
    wbs: '1',
    start: '2026-05-01',
    end: '2026-05-10',
    duration: 10,
    sortOrder: 1,
  });
  const excavation = await mkTask({
    title: '1.1 Excavation',
    parent: foundation._id,
    wbs: '1.1',
    start: '2026-05-01',
    end: '2026-05-04',
    duration: 4,
    assignees: [member._id],
    sortOrder: 1,
  });
  const slab = await mkTask({
    title: '1.2 Slab pour',
    parent: foundation._id,
    wbs: '1.2',
    start: '2026-05-05',
    end: '2026-05-10',
    duration: 6,
    assignees: [member._id],
    sortOrder: 2,
  });
  const framing = await mkTask({
    title: '2. Framing',
    wbs: '2',
    start: '2026-05-11',
    end: '2026-05-25',
    duration: 15,
    assignees: [member._id],
    sortOrder: 2,
  });
  const roofing = await mkTask({
    title: '3. Roofing',
    wbs: '3',
    start: '2026-05-26',
    end: '2026-06-02',
    duration: 8,
    assignees: [member._id],
    sortOrder: 3,
  });
  const interior = await mkTask({
    title: '4. Interior',
    wbs: '4',
    start: '2026-05-26',
    end: '2026-06-15',
    duration: 21,
    assignees: [member._id],
    sortOrder: 4,
  });

  log.log('Creating dependencies (FS)...');
  const link = (predId: Types.ObjectId, succId: Types.ObjectId, lag = 0) =>
    Deps.create({
      workspaceId: ws._id,
      projectId: project._id,
      predecessorId: predId,
      successorId: succId,
      type: 'FS',
      lagDays: lag,
    });
  await link(excavation._id, slab._id);
  await link(slab._id, framing._id);
  await link(framing._id, roofing._id);
  await link(roofing._id, interior._id);

  log.log('Computing CPM snapshot (construction)...');
  const result = await cpm.compute(String(project._id));
  log.log(
    `CPM done — duration: ${result.durationDays}d, critical tasks: ${result.criticalTaskIds.length}`,
  );

  log.log('Creating website development project (software workspace)...');
  await Projects.deleteMany({ workspaceId: wsDev._id });
  const webProject = await Projects.create({
    workspaceId: wsDev._id,
    name: 'Kurumsal web sitesi — MVP yayını',
    description:
      'Keşif ve kullanıcı deneyimi, görsel tasarım, ön yüz geliştirme, headless içerik yönetimi, kalite güvencesi ve canlıya alma süreçleri.',
    code: 'WEB-MVP',
    status: 'active',
    leadId: owner._id,
    startDate: new Date('2026-06-02T00:00:00.000Z'),
    endDate: new Date('2026-08-22T00:00:00.000Z'),
  });

  await Tasks.deleteMany({ projectId: webProject._id });
  await Deps.deleteMany({ projectId: webProject._id });

  const mkDevTask = async (
    over: Partial<{
      title: string;
      parent: Types.ObjectId | null;
      wbs: string;
      start: string;
      end: string;
      duration: number;
      assignees: Types.ObjectId[];
      sortOrder: number;
    }>,
  ) =>
    Tasks.create({
      workspaceId: wsDev._id,
      projectId: webProject._id,
      title: over.title!,
      parentTaskId: over.parent ?? null,
      wbsCode: over.wbs,
      startDate: D(over.start!),
      endDate: D(over.end!),
      durationDays: over.duration!,
      status: 'not_started',
      priority: 'medium',
      assigneeIds: over.assignees ?? [],
      sortOrder: over.sortOrder ?? 0,
    });

  const disc = await mkDevTask({
    title: '1. Keşif',
    wbs: '1',
    start: '2026-06-02',
    end: '2026-06-12',
    duration: 11,
    sortOrder: 1,
  });
  const req = await mkDevTask({
    title: '1.1 Gereksinimler ve bilgi mimarisi',
    parent: disc._id,
    wbs: '1.1',
    start: '2026-06-02',
    end: '2026-06-06',
    duration: 5,
    assignees: [member._id],
    sortOrder: 1,
  });
  const wire = await mkDevTask({
    title: '1.2 UX taslağı ve içerik planı',
    parent: disc._id,
    wbs: '1.2',
    start: '2026-06-07',
    end: '2026-06-12',
    duration: 6,
    assignees: [member._id],
    sortOrder: 2,
  });
  const design = await mkDevTask({
    title: '2. Görsel arayüz tasarımı',
    wbs: '2',
    start: '2026-06-13',
    end: '2026-06-24',
    duration: 12,
    assignees: [member._id],
    sortOrder: 2,
  });
  const feShell = await mkDevTask({
    title: '3.1 Ön yüz iskeleti ve yönlendirme',
    wbs: '3.1',
    start: '2026-06-22',
    end: '2026-06-28',
    duration: 7,
    assignees: [member._id],
    sortOrder: 3,
  });
  const fePages = await mkDevTask({
    title: '3.2 Duyarlı sayfalar ve bileşenler',
    wbs: '3.2',
    start: '2026-06-29',
    end: '2026-07-18',
    duration: 20,
    assignees: [member._id],
    sortOrder: 4,
  });
  const cms = await mkDevTask({
    title: '4. Headless içerik yönetimi ve API bağlantıları',
    wbs: '4',
    start: '2026-07-14',
    end: '2026-07-31',
    duration: 18,
    assignees: [member._id],
    sortOrder: 5,
  });
  const qa = await mkDevTask({
    title: '5. Test, erişilebilirlik ve SEO',
    wbs: '5',
    start: '2026-07-28',
    end: '2026-08-12',
    duration: 16,
    assignees: [member._id],
    sortOrder: 6,
  });
  const goLive = await mkDevTask({
    title: '6. Canlı yayın ve teslim',
    wbs: '6',
    start: '2026-08-11',
    end: '2026-08-22',
    duration: 12,
    assignees: [member._id],
    sortOrder: 7,
  });

  log.log('Creating dependencies — website project (FS)...');
  const linkDev = (predId: Types.ObjectId, succId: Types.ObjectId, lag = 0) =>
    Deps.create({
      workspaceId: wsDev._id,
      projectId: webProject._id,
      predecessorId: predId,
      successorId: succId,
      type: 'FS',
      lagDays: lag,
    });
  await linkDev(req._id, wire._id);
  await linkDev(wire._id, design._id);
  await linkDev(design._id, feShell._id);
  await linkDev(feShell._id, fePages._id);
  await linkDev(fePages._id, cms._id);
  await linkDev(cms._id, qa._id);
  await linkDev(qa._id, goLive._id);

  log.log('Computing CPM snapshot (website project)...');
  const webCpm = await cpm.compute(String(webProject._id));
  log.log(
    `CPM done (web) — duration: ${webCpm.durationDays}d, critical tasks: ${webCpm.criticalTaskIds.length}`,
  );

  log.log('Seed complete.');
  log.log(`  Workspaces: ${DEMO_WORKSPACE_NAMES.join(', ')}`);
  log.log('  Login: owner@demo.local / Passw0rd!');
  log.log('  Login: member@demo.local / Passw0rd!');
  await app.close();
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
