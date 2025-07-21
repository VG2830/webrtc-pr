import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { CallPage } from './call.page';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, FormsModule,CallPage ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy },AndroidPermissions],
  bootstrap: [AppComponent],
})
export class AppModule {}
