export class CreateLeaveDto {
  user!: string;
  institute!: string;
  from!: string;
  to!: string;
  reason?: string;
  meta?: any;
}

export class ApproveLeaveDto {
  approver!: string;
  approve!: boolean;
  notes?: string;
}

export class UpdateLeaveDto {
  user!: string;
  from?: string;
  to?: string;
  reason?: string;
  applicationText?: string;
}

export class DecideLeaveDto {
  approverId!: string;
  approve!: boolean;
  rejectionReason?: string;
}

export class ResubmitLeaveDto {
  userId!: string;
  text!: string;
}
