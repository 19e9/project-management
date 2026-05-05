import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingService } from './billing.service';
import {
  SubscriptionPlan,
  SubscriptionPlanSchema,
} from './schemas/subscription-plan.schema';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Refund, RefundSchema } from './schemas/refund.schema';
import {
  EnterpriseContract,
  EnterpriseContractSchema,
} from './schemas/enterprise-contract.schema';
import {
  PlanChangeLog,
  PlanChangeLogSchema,
} from './schemas/plan-change-log.schema';
import { SeatEvent, SeatEventSchema } from './schemas/seat-event.schema';
import { Workspace, WorkspaceSchema } from '../workspaces/schemas/workspace.schema';
import {
  WorkspaceMember,
  WorkspaceMemberSchema,
} from '../workspaces/schemas/workspace-member.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Refund.name, schema: RefundSchema },
      { name: EnterpriseContract.name, schema: EnterpriseContractSchema },
      { name: PlanChangeLog.name, schema: PlanChangeLogSchema },
      { name: SeatEvent.name, schema: SeatEventSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: WorkspaceMember.name, schema: WorkspaceMemberSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
