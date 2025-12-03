import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Club, ClubDocument } from "./club.schema";
import { CreateClubDto } from "./dto/create-club.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { Server } from "socket.io";
import { Inject } from "@nestjs/common";

@Injectable()
export class ClubService {
  constructor(
    @InjectModel(Club.name) private clubModel: Model<ClubDocument>,
    // optional injection of websocket server for pushing events from service
    @Inject("SOCKET_SERVER") private server?: Server
  ) {}

  async createClub(dto: CreateClubDto, ownerId: string) {
    const club = await this.clubModel.create({
      name: dto.name,
      description: dto.description || "",
      owner: new Types.ObjectId(ownerId),
      members: [new Types.ObjectId(ownerId)],
      isPublic: dto.isPublic ?? true,
      tags: dto.tags || [],
    });
    return club;
  }

  async getClubs(query = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const clubs = await this.clubModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();
    const total = await this.clubModel.countDocuments(query);
    return { data: clubs, total, page, limit };
  }

  async getClubById(id: string) {
    const club = await this.clubModel.findById(id).lean();
    if (!club) throw new NotFoundException("Club not found");
    return club;
  }

  async joinClub(clubId: string, userId: string) {
    const club = await this.clubModel.findById(clubId);
    if (!club) throw new NotFoundException("Club not found");
    if (!club.members || !club.members.some((m) => m.equals(userId))) {
      if (!club.members) {
        club.members = [];
      }
      club.members.push(new Types.ObjectId(userId));
      await club.save();
    }
    return club;
  }

  async leaveClub(clubId: string, userId: string) {
    const club = await this.clubModel.findById(clubId);
    if (!club) throw new NotFoundException("Club not found");
    if (!club.members || !club.members.length) {
      // nothing to remove
      return club;
    }
    club.members = club.members.filter((m) => !m.equals(userId));
    await club.save();
    return club;
  }

  // send message (persist and emit event)
  async sendMessage(clubId: string, userId: string, dto: SendMessageDto) {
    const club = await this.clubModel.findById(clubId);

    if (!club) throw new NotFoundException("Club not found");
    // optionally check membership for private clubs
    if (
      !club.isPublic &&
      (!club.members || !club.members.some((m) => m.equals(userId)))
    ) {
      throw new BadRequestException("Not a member of this club");
    }

    const message = {
      sender: new Types.ObjectId(userId),
      type:
        dto.type ||
        (dto.attachments && dto.attachments.length ? "file" : "text"),
      text: dto.text || "",
      attachments: dto.attachments || [],
      readBy: [new Types.ObjectId(userId)], // mark sender as read
      createdAt: new Date(),
    };

    if (!club.messages) {
      club.messages = [];
    }
    club.messages.push(message as any);
    await club.save();

    const savedMsg =
      club.messages && club.messages.length
        ? club.messages[club.messages.length - 1]
        : message;

    // emit via websocket if available
    try {
      this.server
        ?.to(`club_${clubId}`)
        .emit("club:message", { clubId, message: savedMsg });
    } catch (e) {
      // swallow errors: websockets are optional
    }

    return savedMsg;
  }

  // pagination for messages (tail-friendly)
  async getMessages(clubId: string, page = 1, limit = 50) {
    const club = await this.clubModel
      .findById(clubId, { messages: { $slice: [(page - 1) * limit, limit] } })
      .populate("messages.sender", "name role")
      .lean();
    if (!club) throw new NotFoundException("Club not found");
    // messages will be in club.messages
    return club.messages || [];
  }

  // mark message read
  async markRead(clubId: string, messageId: string, userId: string) {
    const club = await this.clubModel.findById(clubId);
    if (!club) throw new NotFoundException("Club not found");

    if (!club.messages || !club.messages.length) {
      throw new NotFoundException("No messages found");
    }

    // ⛔ club.messages.id() DOES NOT WORK — replace with .find()
    const msg = (club.messages || []).find(
      (m: any) => m._id?.toString() === messageId.toString()
    );

    if (!msg) throw new NotFoundException("Message not found");

    msg.readBy = msg.readBy || [];

    // ⛔ r is implicitly 'any' — add type
    const alreadyRead = msg.readBy.some(
      (r: any) => r.toString() === userId.toString()
    );

    if (!alreadyRead) {
      msg.readBy.push(new Types.ObjectId(userId));
      await club.save();
    }

    return msg;
  }

  // basic search (text)
  async searchMessages(clubId: string, q: string, limit = 50) {
    const club = await this.clubModel.findById(clubId).lean();
    if (!club) throw new NotFoundException("Club not found");
    const results = (club.messages || []).filter((m) =>
      (m.text || "").toLowerCase().includes(q.toLowerCase())
    );
    return results.slice(0, limit);
  }
}
