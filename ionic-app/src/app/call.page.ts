import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { IonicModule } from '@ionic/angular';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-call',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './call.page.html',
  styleUrls: ['./call.page.scss'],
})
export class CallPage  {
  socket!: Socket;
  peerConnection!: RTCPeerConnection;
  localStream!: MediaStream;
  remoteStream!: MediaStream;
  callStatus: string = 'Not connected';

  currentUserId: string | undefined; // Replace with unique user ID
  userList: { id: string; socketId: any }[] = [];
  pendingCandidates: RTCIceCandidate[] = [];
  remoteDescriptionSet = false;

  // configuration = {
  //   iceServers: [{ urls: 'stun:stun.l.google.com:19302' }], //stun server
  // };
  //turn server necessary for production

  configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
};

  hangbtn!: any;
  
constructor(private androidPermissions: AndroidPermissions) {
    this.initUserId();
    this.checkPermission();
    try {
       this.getMicrophoneAccess(); // Ensure mic access before connection
       this.setUpConnection();
    } catch (err) {
      console.error('Initialization error:', err);
      this.callStatus = 'Error: ' + this.getErrorMessage(err);
    }
  
}

//turn server necessary for production

//   configuration = {
//   iceServers: [
//     { urls: 'stun:stun.l.google.com:19302' },
//     {
//       urls: 'turn:openrelay.metered.ca:80',
//       username: 'openrelayproject',
//       credential: 'openrelayproject'
//     }
//   ]
// };

  // Helper to get error message safely
  private getErrorMessage(err: any): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return (err as any).message;
    }
    return String(err);
  }

  async ionViewDidEnter(){
    await this.initUserId();

   const micPermissionGranted = await this.checkPermission();

  if (!micPermissionGranted) {
    this.callStatus = 'Microphone permission denied';
    return;
  }

  try {
    await this.getMicrophoneAccess();
    await this.setUpConnection();
  } catch (err) {
    console.error('Initialization error:', err);
    this.callStatus = 'Error: ' + this.getErrorMessage(err);
  }
  }

  async getMicrophoneAccess() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('🎤 Microphone access granted');
    } catch (err) {
      console.error('Microphone permission denied:', err);
      this.callStatus = 'Microphone access denied';
      alert('Microphone access is required to use calling features.');
      throw err;
    }
  }

  async setUpConnection() {
    this.socket = io('https://webrtc-pr.onrender.com');

    // this.socket = io('http://localhost:3000');

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.socket.emit('register', this.currentUserId);
      this.callStatus = 'Socket connected';
    });

    this.socket.on('user-list', (users: any) => {
      this.userList = Object.entries(users)
        .filter(([id]) => id !== this.currentUserId)
        .map(([id, socketId]) => ({ id, socketId }));
    });
//call-made
  this.socket.on('call-made', async (data) => {
  try {
    console.log('📞 Incoming call from:', data.from);
    
    // Create peer connection
    this.peerConnection = new RTCPeerConnection(this.configuration);
    this.setupPeerConnectionListeners(data.from);

    // Add local audio track
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // ✅ Correct: only handle offer here
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

    // ✅ Answer creation
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    // ✅ Send answer
    this.socket.emit('make-answer', {
      answer,
      to: data.from
    });

    // ✅ Now set flag and flush pending ICE
    this.remoteDescriptionSet = true;
    await this.flushPendingCandidates();

  } catch (err) {
    console.error('Error handling call-made:', err);
    this.callStatus = 'Error: ' + this.getErrorMessage(err);
  }
});

//call-made


//answer-made

this.socket.on('answer-made', async (data) => {
  try {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      this.remoteDescriptionSet = true;
      await this.flushPendingCandidates();
    }
  } catch (err) {
    console.error('Error handling answer-made:', err);
  }
});

  // old code

  // this.socket.on('answer-made', async (data) => {
  //     try {
  //       if (this.peerConnection) {
  //         await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
  //         this.remoteDescriptionSet = true;
  //         await this.flushPendingCandidates();
        
  //       }
  //     } catch (err) {
  //       console.error('Error handling answer-made:', err);
  //       this.callStatus = 'Error: ' + this.getErrorMessage(err);
  //     }
  //   });

//answer-made
  
    this.socket.on('ice-candidate', async (data) => {
      try {
        const candidate = new RTCIceCandidate(data.candidate);
        if (this.peerConnection) {
          if (this.remoteDescriptionSet) {
            try {
              console.log('Remote ICE candidate received:', data.candidate);
              await this.peerConnection.addIceCandidate(data.candidate);
            } catch (err) {
              console.error('Failed to add ICE candidate:', err);
            }
          } else {
            this.pendingCandidates.push(candidate);
          }
        }
      } catch (err) {
        console.error('Error handling ice-candidate:', err);
      }
    });
  }

async flushPendingCandidates() {
  for (const candidate of this.pendingCandidates) {
    try {
      await this.peerConnection.addIceCandidate(candidate);
    } catch (err) {
      console.error('Failed to add buffered ICE candidate:', err);
    }
  }
  this.pendingCandidates = [];
}


  async checkPermission(): Promise<boolean> {
  const permission = this.androidPermissions.PERMISSION.RECORD_AUDIO;
  const result = await this.androidPermissions.checkPermission(permission);

  if (!result.hasPermission) {
    const requestResult = await this.androidPermissions.requestPermission(permission);
    return requestResult.hasPermission;
  }

  return true;
}

  async initUserId() {
    const savedId = localStorage.getItem('user_id');
    if (savedId) {
      this.currentUserId = savedId;
    } else {
      const userId = prompt('Enter a unique name or number:')?.trim();
      this.currentUserId =
        userId && userId.length > 0
          ? userId
          : 'user_' + Math.floor(Math.random() * 10000);
      localStorage.setItem('user_id', this.currentUserId);
    }
  }

async startCall(user: { id: string; socketId: string }) {
  try {
    console.log(`📞 Calling ${user.id}`);
    this.peerConnection = new RTCPeerConnection(this.configuration);
    this.setupPeerConnectionListeners(user.id);
      // this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
       console.log(this.localStream);
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    } else {
      this.callStatus = 'Error: No local audio stream';
      return;
    }
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.socket.emit('call-user', { offer, to: user.id });
  } catch (err) {
    console.error('Error starting call:', err);
    this.callStatus = 'Error: ' + this.getErrorMessage(err);
  }
}

  setupPeerConnectionListeners(targetUserId: string) {
    if (!this.peerConnection) return;
    //
    // this.peerConnection.ontrack = (event) => {
    //   this.remoteStream = event.streams[0];
    //   const audio = new Audio();
    //   audio.srcObject = this.remoteStream;
    //   audio.play();
    // };
    //
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('local ice candi',event.candidate);
        this.socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: targetUserId,
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      this.remoteStream.addTrack(event.track);
      this.callStatus = 'Connected track ✅';
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
      if (this.peerConnection.connectionState === 'connected') {
        this.callStatus = ' Final Connected ✅';
        // const hangbtn=document.getElementById("endcall");
        // hangbtn.style.display="block";
      } else if (
        this.peerConnection.connectionState === 'disconnected' ||
        this.peerConnection.connectionState === 'failed'
      ) {
        this.callStatus = 'Disconnected ❌';
         this.hangUp();
      }
    };
  }

  hangUp() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = undefined!;
      this.callStatus = 'Not connected';
      // Notify remote peer (optional, if you want to implement remote hangup)
      if (this.socket && this.currentUserId) {
        this.socket.emit('hang-up', { from: this.currentUserId });
      }
    }
    // Clean up streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = undefined!;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = undefined!;
    }
  }

  // Expose remote stream for playback in template
  getRemoteStream(): MediaStream | undefined {
    return this.remoteStream;
  }
}
