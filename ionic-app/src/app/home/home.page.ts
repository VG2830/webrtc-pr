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
