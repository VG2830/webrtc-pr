import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CallPageRoutingModule } from './call-routing.module';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { CallPage } from './call.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CallPageRoutingModule
  ],
  declarations: [CallPage],providers: [AndroidPermissions],
})
export class CallPageModule {}
