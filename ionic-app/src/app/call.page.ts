
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { IonicModule } from '@ionic/angular';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-call',
  standalone:true,
  imports:[IonicModule,CommonModule],
  templateUrl: './call.page.html',
  styleUrls: ['./call.page.scss'],
})
export class CallPage implements OnInit {
  socket!: Socket;
  peerConnection!: RTCPeerConnection;
  localStream!: MediaStream;
  remoteStream!: MediaStream;
  callStatus: string = 'Not connected';

  currentUserId :string | undefined; // Replace with unique user ID
  userList: { id: string; socketId: any }[] = [];

  configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  

 async ngOnInit() {
     
      await this.initUserId();


    this.socket = io('http://localhost:3000'); 

    this.socket.on('connect', () => {
      console.log(' Socket connected:', this.socket.id);
      console.log("register ",this.currentUserId);
      this.socket.emit('register', this.currentUserId);
      this.callStatus = 'Socket connected ';

    });

    this.socket.on('user-list', (users: any) => {
      this.userList = Object.entries(users)
        .filter(([id]) => id !== this.currentUserId)
        .map(([id, socketId]) => ({ id, socketId }));
    });

    this.socket.on('call-made', async (data) => {
      this.peerConnection = new RTCPeerConnection(this.configuration);
      this.setupPeerConnectionListeners(data.from);
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.localStream.getTracks().forEach((track) => this.peerConnection.addTrack(track, this.localStream));
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.socket.emit('make-answer', { answer, to: data.from });
    });

    this.socket.on('answer-made', async (data) => {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    this.socket.on('ice-candidate', async(data) => {
      if (this.peerConnection) {
       await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    }  
  );
  }
async initUserId() {
  const savedId = localStorage.getItem('user_id');
  if (savedId) {
    this.currentUserId = savedId;
  } else {
    const userId = prompt('Enter a unique name or number:')?.trim();
    this.currentUserId = userId && userId.length > 0 ? userId : 'user_' + Math.floor(Math.random() * 10000);
    localStorage.setItem('user_id', this.currentUserId);
  }
}


  async startCall(user: { id: string; socketId: string }) {
console.log(`📞 Calling ${user.id}`);
    this.peerConnection = new RTCPeerConnection(this.configuration);
    this.setupPeerConnectionListeners(user.id);
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.localStream.getTracks().forEach((track) => this.peerConnection.addTrack(track, this.localStream));
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.socket.emit('call-user', { offer, to: user.id });
  }
  

  setupPeerConnectionListeners(targetUserId: string) {
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', { candidate: event.candidate, to: targetUserId });
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      this.remoteStream.addTrack(event.track);
      this.callStatus = 'Connected ✅';
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
      if (this.peerConnection.connectionState === 'connected') {
        this.callStatus = 'Connected ✅';
      } else if (
        this.peerConnection.connectionState === 'disconnected' ||
        this.peerConnection.connectionState === 'failed'
      ) {
        this.callStatus = 'Disconnected ❌';
      }
    };
  }

  hangUp() {
    if (this.peerConnection) {
      this.peerConnection.close();
     this.peerConnection = undefined!;
      this.callStatus = 'Not connected';
    }
  }
}
