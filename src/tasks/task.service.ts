// src/tasks/task.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Task, TaskDocument, TaskStatus } from './task.schema';
import { Model, Types } from 'mongoose';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';

@Injectable()
export class TaskService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  // Create task (assignedBy is user id)
  async createTask(dto: CreateTaskDto, assignedBy: string, instituteId?: string) {
    const task = await this.taskModel.create({
      ...dto,
      assignedBy: new Types.ObjectId(assignedBy),
      assignedTo: (dto.assignedTo || []).map((id) => new Types.ObjectId(id)),
      institute: instituteId ? new Types.ObjectId(instituteId) : undefined,
    });
    return task.toObject();
  }

  // Get tasks assigned to a user OR created by user (depending on role)
//   async getTasksForUser(userId: string, role: string, instituteId?: string) {
//     const q: any = {};
//     if (instituteId) q.institute = instituteId;
//     // Students/parents see only those assigned to them
//     // Teachers/principals/admins may see assignedBy or assignedTo
//     if (role === 'student' || role === 'parent') {
//       q.assignedTo = { $in: [new Types.ObjectId(userId)] };
//     } else {
//       // for staff: show tasks in same institute (broad)
//       // you can refine this to role-specific visibility
//       // e.g. teachers see tasks they created OR tasks assigned to their classes
//     }
//     // const tasks = await this.taskModel.find(q).sort({ createdAt: -1 }).lean();

//     console.log("Querying tasks with:", q);
// const tasks = await this.taskModel.find(q).sort({ createdAt: -1 }).lean();
// console.log("Found tasks:", tasks);

//     return tasks;
//   }
async getTasksForUser(userId: string, role: string, instituteId?: string) {
  const q: any = {};

  if (instituteId) q.institute = new Types.ObjectId(instituteId); // <-- important

  if (role === 'student' || role === 'parent') {
    q.assignedTo = { $in: [new Types.ObjectId(userId)] };
  }

  console.log("Querying tasks with:", q);
  const tasks = await this.taskModel.find(q).sort({ createdAt: -1 }).lean();
  console.log("Found tasks:", tasks);

  return tasks;
}

  async getTaskById(id: string) {
    const task = await this.taskModel.findById(id).lean();
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async updateProgress(taskId: string, userId: string, dto: UpdateProgressDto) {
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');

    // Only assignee(s) or assignedBy (owner) can update progress
    const isAssigned = (task.assignedTo || []).some((m) => m.equals(userId));
    const isOwner = task.assignedBy?.equals(userId);
    if (!isAssigned && !isOwner) throw new ForbiddenException('Not allowed');

    task.progress = dto.progress;
    // auto-set status if completed
    if (dto.progress >= 100) {
task.status = TaskStatus.COMPLETED;
    } else if (task.status === TaskStatus.COMPLETED) {
      task.status = TaskStatus.IN_PROGRESS;
    }
    await task.save();
    return task;
  }

  async submitTask(taskId: string, userId: string, dto: SubmitTaskDto) {
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');

    const isAssigned = (task.assignedTo || []).some((m) => m.equals(userId));
    if (!isAssigned) throw new ForbiddenException('Not assigned to this task');

    const submission = {
      submittedBy: new Types.ObjectId(userId),
      attachments: dto.attachments || [],
      comment: dto.comment,
      submittedAt: new Date(),
      approved: false,
    };
    task.submissions = task.submissions || [];
    task.submissions.push(submission as any);
    task.status = TaskStatus.SUBMITTED;
    await task.save();
    return submission;
  }

  async approveSubmission(taskId: string, submissionId: string, approverId: string) {
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');

    // Only assignedBy or higher role can approve — caller should be validated in controller
    const submission = (task.submissions || []).find((s: any) => s._id.toString() === submissionId);
    if (!submission) throw new NotFoundException('Submission not found');

    submission.approved = true;
    task.approved = true; // optional: mark task approved
    await task.save();
    return submission;
  }

  // Summary for the dashboard
  async getSummary(instituteId?: string) {
    const match: any = {};
    if (instituteId) match.institute = new Types.ObjectId(instituteId);

    const total = await this.taskModel.countDocuments(match);
    const completed = await this.taskModel.countDocuments({ ...match, status: 'Completed' });
    const pending = await this.taskModel.countDocuments({ ...match, status: { $in: ['In Progress', 'Submitted', 'Awaiting Approval'] } });
    const delayed = await this.taskModel.countDocuments({ ...match, status: 'Delayed' });
    const awaitingApproval = await this.taskModel.countDocuments({ ...match, approved: false, 'submissions.0': { $exists: true } });

    return { total, completed, pending, delayed, awaitingApproval };
  }

  // Search tasks assigned to user
  async searchTasks(userId: string, q: string) {
    const regex = new RegExp(q, 'i');
    const tasks = await this.taskModel.find({ $or: [{ title: regex }, { description: regex }], assignedTo: new Types.ObjectId(userId) }).lean();
    return tasks;
  }
}
