# Attendance Module (NestJS + Mongoose)

This module implements an attendance and leave management backend for students, teachers and other users.

## Files
- `attendance.schema.ts` - Mongoose schema for Attendance records.
- `leave.schema.ts` - Mongoose schema for LeaveRequest.
- `attendance.service.ts` - Business logic: mark, bulk, queries, leave approval.
- `attendance.controller.ts` - HTTP endpoints.
- `dto/*` - Data Transfer Objects used by controller/service.

## Quick integration
1. Copy the `attendance` folder into your NestJS `src/` directory.
2. Import `AttendanceModule` into your `AppModule`:
```ts
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [
    // ... other modules
    AttendanceModule,
  ],
})
export class AppModule {}
```

3. The module expects `UsersModule` and `InstitutesModule` to be present and provide methods:
   - `UsersService.findById(id)` to validate users.
   - `InstitutesService.findById(id)` to validate institutes.

## Endpoints
Base path: `/api/attendance` (depending on your global prefix)

### Attendance
- `POST /attendance/mark`  
  Body: `{ user, institute, date, status, checkIn?, checkOut?, meta?, createdBy? }`

- `POST /attendance/bulk`  
  Body: `{ institute, items: [{ user, date, status, checkIn?, checkOut?, meta? }] }`

- `GET /attendance/user/:id?from=&to=`  
  Returns attendance records for the user within optional range.

- `GET /attendance/summary?instituteId=&from=&to=&role=`  
  Returns counts grouped by status in the range and optional role filter.

- `GET /attendance/chart/month?instituteId=&year=&month=&userId?`  
  Returns aggregated data per day for month.

### Leave Management
- `POST /attendance/leave`  
  Body: `{ user, institute, from, to, reason?, meta? }`

- `GET /attendance/leave?institute=&user=&status=`  
  List leave requests.

- `PUT /attendance/leave/:id/approve`  
  Body: `{ approver, approve: true/false, notes? }`  
  Approving will create `onleave` attendance records for the date range.

## Notes & ideas
- The module stores attendance per-user per-day with a unique index.
- Approving leave can optionally upsert attendance entries for each day in the leave range.
- You can extend `meta` to store GPS, photo evidence, or device info.
- For large-scale bulk operations use background workers or one-off jobs.
- Add authentication/authorization guards (`JwtAuthGuard`) to protect endpoints.
