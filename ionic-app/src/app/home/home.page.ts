import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone:true,
    imports:[IonicModule,CommonModule],
})
export class HomePage {

  constructor(private router: Router,private platform: Platform) {
    if (this.platform.is('android') || this.platform.is('ios')) {
    this.requestMicPermission();
  }
  }
 async ngOnInit(){
  
 }
  
//      async ionViewDidEnter() {
//   if (this.platform.is('android') || this.platform.is('ios')) {
//     await this.requestMicPermission();
//   }
// }
   onButtonClick() {
    this.router.navigate(['/call']);
  }
async requestMicPermission() {
  if (Capacitor.getPlatform() === 'android') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted', stream);
      // await this.setupVoiceCall();
       this.onButtonClick();
    } catch (err) {
      console.error('Mic permission denied or failed:', err);
      alert('Microphone access is required to join the call.');
    }
  } else {
    // For iOS / Web
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted', stream);
      // await this.setupVoiceCall();
    } catch (err) {
      console.error('Mic permission denied or failed:', err);
      alert('Microphone access is required to join the call.');
    }
  }
}
}


//call.page.ts commented code
// this.socket.on('answer-made', async (data) => {
//       try {
//         if (this.peerConnection) {
//           await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
//           this.remoteDescriptionSet = true;
//           await this.flushPendingCandidates();
//           // Add pending ICE candidates after remote description is set
//           // for (const candidate of this.pendingCandidates) {
//           //   try {
//           //     await this.peerConnection.addIceCandidate(candidate);
//           //   } catch (err) {
//           //     console.error('Failed to add pending ICE candidate:', err);
//           //   }
//           // }
//           // this.pendingCandidates = [];
//         }
//       } catch (err) {
//         console.error('Error handling answer-made:', err);
//         this.callStatus = 'Error: ' + this.getErrorMessage(err);
//       }
//     });

//   async ngOnInit() {
//   await this.initUserId();
  
//   const micPermissionGranted = await this.checkPermission();

//   if (!micPermissionGranted) {
//     this.callStatus = 'Microphone permission denied';
//     return;
//   }

//   try {
//     await this.getMicrophoneAccess();
//     await this.setUpConnection();
//   } catch (err) {
//     console.error('Initialization error:', err);
//     this.callStatus = 'Error: ' + this.getErrorMessage(err);
//   }
// }

//calll-made
  // this.socket.on('call-made', async (data) => {
  //     try {
  //       this.peerConnection = new RTCPeerConnection(this.configuration);
  //       this.setupPeerConnectionListeners(data.from);
  //     // this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  //           console.log(this.localStream);
  //       if (this.localStream) {
  //         this.localStream.getTracks().forEach((track) => {
  //           this.peerConnection.addTrack(track, this.localStream);
  //         });
  //       }
  //       await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer || data.answer));
  //       // Add pending ICE candidates after remote description is set
  //       this.remoteDescriptionSet = true;
  //       await this.flushPendingCandidates();
       
  //       const answer = await this.peerConnection.createAnswer();
  //       await this.peerConnection.setLocalDescription(answer);
  //       this.socket.emit('make-answer', { answer, to: data.from});
  //     } catch (err) {
  //       console.error('Error handling call-made:', err);
  //       this.callStatus = 'Error: ' + this.getErrorMessage(err);
  //     }
  //   });