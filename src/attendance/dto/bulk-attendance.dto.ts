export class BulkAttendanceItem {
  user!: string;
  date!: string;
  status!: 'present' | 'absent' | 'late' | 'excused' | 'onleave';
  checkIn?: string;
  checkOut?: string;
  meta?: any;
}

export class BulkAttendanceDto {
  institute!: string;
  items!: BulkAttendanceItem[];
}
