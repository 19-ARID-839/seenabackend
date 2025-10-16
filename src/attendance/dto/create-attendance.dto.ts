export class CreateAttendanceDto {
  user!: string; // user ObjectId
  institute!: string; // institute ObjectId
  date!: string; // ISO date string or yyyy-mm-dd
  status!: 'present' | 'absent' | 'late' | 'excused' | 'onleave';
  checkIn?: string;
  checkOut?: string;
  meta?: any;
  createdBy?: string;
}
