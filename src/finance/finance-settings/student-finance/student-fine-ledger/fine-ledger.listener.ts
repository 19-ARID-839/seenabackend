import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Attendance } from "src/attendance/attendance.schema";
import { FeeChallanService } from "../fee-challan.service";

@Injectable()
export class FineLedgerListener {
  constructor(private readonly feeService: FeeChallanService) {}

@OnEvent("attendance.marked")
async handleAttendance(att: Attendance) {
  console.log("📣 Attendance event received:", {
    user: att.user,
    status: att.status,
    date: att.date,
  });

  await this.feeService.processAttendance(att);
}

}
