import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: '/clubs', cors: { origin: '*' } })
@Injectable()
export class ClubGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger('ClubGateway');

  afterInit(server: Server) {
    this.logger.log('ClubGateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // expect client to join rooms like 'club_<clubId>' after auth
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // client emits 'join' with clubId to join room
  @SubscribeMessage('join')
  handleJoin(@MessageBody() payload: { clubId: string }, @ConnectedSocket() client: Socket) {
    client.join(`club_${payload.clubId}`);
    client.emit('joined', { clubId: payload.clubId });
  }

  @SubscribeMessage('leave')
  handleLeave(@MessageBody() payload: { clubId: string }, @ConnectedSocket() client: Socket) {
    client.leave(`club_${payload.clubId}`);
    client.emit('left', { clubId: payload.clubId });
  }

  // optionally handle sending messages directly via sockets
  @SubscribeMessage('message')
  async handleMessage(@MessageBody() payload: any, @ConnectedSocket() client: Socket) {
    // payload should include clubId and message, validate & then emit to room
    this.server.to(`club_${payload.clubId}`).emit('club:message', payload.message);
  }

  
}
