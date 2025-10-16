export class QueryAttendanceDto {
  userId?: string;
  instituteId?: string;
  from?: string;
  to?: string;
  role?: string;
  page?: number;
  limit?: number;
}
