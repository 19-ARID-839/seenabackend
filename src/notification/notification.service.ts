import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Notification, NotificationDocument } from "./notification.schema";
import { UsersService } from "../users/users.service";
import { InstitutesService } from "../institutes/institutes.service";

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private readonly usersService: UsersService,
    private readonly institutesService: InstitutesService
  ) {}

  //  Notify 

  

  /** Send (create) a new notification */
  async sendNotification(payload: {
    sender: string;
    receiver: string;
    institute: any; // can be string or object
    messageType: string;
    medium: string;
    message: string;
    meta?: any;
  }) {
    const { sender, receiver, institute, messageType, medium, message, meta } =
      payload;

    if (!sender || !receiver || !institute || !message) {
      throw new BadRequestException("Missing required fields");
    }

    // 🧩 Normalize institute ID (handle both object and string)
    const instituteId =
      typeof institute === "object" ? institute._id || institute.id : institute;

    // 🧩 Validate all IDs
    if (
      !Types.ObjectId.isValid(sender) ||
      !Types.ObjectId.isValid(receiver) ||
      !Types.ObjectId.isValid(instituteId)
    ) {
      throw new BadRequestException("Invalid IDs provided");
    }

    // 🧩 Fetch related docs (optional but good for validation/logs)
    const [senderDoc, receiverDoc, instituteDoc] = await Promise.all([
      this.usersService.findById(sender),
      this.usersService.findById(receiver),
      this.institutesService.findById(instituteId),
    ]);

    if (!senderDoc) throw new NotFoundException(`Sender not found: ${sender}`);
    if (!receiverDoc)
      throw new NotFoundException(`Receiver not found: ${receiver}`);
    if (!instituteDoc)
      throw new NotFoundException(`Institute not found: ${instituteId}`);

    // 📨 Save the notification
    const notification = await this.notificationModel.create({
      sender: new Types.ObjectId(sender),
      receiver: new Types.ObjectId(receiver),
      institute: new Types.ObjectId(instituteId),
      messageType,
      medium,
      message,
      meta,
      status: "sent",
    });

    console.log(
      `📨 Notification sent from ${senderDoc.name} to ${receiverDoc.name}:`,
      message
    );

    // You can later plug in real SMS/email integrations here
    return notification;
  }

  /** Get notifications sent by a user */
  async getSentNotifications(userId: string) {
    return this.notificationModel
      .find({ sender: userId })
      .populate("receiver", "name email phone")
      .sort({ createdAt: -1 })
      .lean();
  }

  // async getUserNotifications(userId: string) {
  //   const notifications = await this.notificationModel
  //     .find({ receiver: new Types.ObjectId(userId) })
  //     .populate("sender", "name role") // ✅ populate sender name and role
  //     .populate("institute", "name code") // optional: populate institute info
  //     .sort({ createdAt: -1 })
  //     .lean();

  //   return notifications;
  // }

  /** Get notifications received by a user */
  async getReceivedNotifications(userId: string) {
    return this.notificationModel
      .find({ receiver: userId })
      .populate("sender", "name email phone")
      .sort({ createdAt: -1 })
      .lean();
  }








    // Create a single notification targeting a role (recommended)
  async sendRoleNotification(payload: {
    sender: string;
    receiverRole: string;
    institute: any;
    messageType: string;
    medium: string;
    message: string;
    isAnonymous?: boolean;
    meta?: any;
  }) {
    const { sender, receiverRole, institute, messageType, medium, message, isAnonymous = true, meta } = payload;

    // Basic validation
    if (!sender || !receiverRole || !institute || !message) {
      throw new BadRequestException('Missing required fields');
    }

    const instituteId = typeof institute === 'object' ? institute._id || institute.id : institute;
    if (!Types.ObjectId.isValid(sender) || !Types.ObjectId.isValid(instituteId)) {
      throw new BadRequestException('Invalid IDs provided');
    }

    // Optionally verify sender exists, and institute exists
    const [senderDoc, instituteDoc] = await Promise.all([
      this.usersService.findById(sender),
      this.institutesService.findById(instituteId),
    ]);
    if (!senderDoc) throw new NotFoundException(`Sender not found: ${sender}`);
    if (!instituteDoc) throw new NotFoundException(`Institute not found: ${instituteId}`);

    const notification = await this.notificationModel.create({
      sender: new Types.ObjectId(sender),   // stored for audits
      receiverRole,                         // important: role-based receiver
      institute: new Types.ObjectId(instituteId),
      messageType,
      medium,
      message,
      meta,
      isAnonymous,
      status: 'sent',
    });

    return notification;
  }

  /**
   * Retrieve notifications for a user:
   * - notifications explicitly addressed to this user (receiver)
   * - OR notifications targeted to the user's role (receiverRole)
   *
   * NOTE: strip/populate sender data according to isAnonymous flag before returning to client.
   */
  async getUserNotifications(userId: string, userRole?: string) {
    if (!userId) return [];

    // Build the query: either targeted directly, or by role
    const query: any = {
      $or: [{ receiver: new Types.ObjectId(userId) }]
    };
    if (userRole) {
      query.$or.push({ receiverRole: userRole });
    }

    // Populate sender (so we can selectively strip details for anonymous)
    const notifications = await this.notificationModel
      .find(query)
      .populate('sender', 'name role') // so we have sender.name and role
      .populate('institute', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    // Remove/hide sender info for anonymous notifications before returning to client
    const safe = notifications.map((n) => {
      if (n.isAnonymous) {
        // keep sender id in DB, but don't reveal to caller
        // return the object with sender removed or anonymized
        const { sender, ...rest } = n;
        // Option A: remove sender entirely:
        return { ...rest, sender: undefined };
        // Option B: keep a generic "Anonymous" label:
        // return { ...rest, sender: { name: 'Anonymous', role: null } };
      } else {
        return n;
      }
    });

    return safe;
  }


  // Notify

  
}
