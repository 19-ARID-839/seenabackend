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
