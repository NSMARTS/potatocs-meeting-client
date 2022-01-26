import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FileUploadModule } from 'ng2-file-upload';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './components/main/main.component';

import { WebRTCComponent } from './components/web-rtc/web-rtc.component';
import { DialogUpdateBitrateComponent, HeaderComponent } from './components/header/header.component';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SidebarComponent } from './components/sidebar/sidebar.component'; 
import { WhiteBoardComponent } from './components/white-board/white-board.component';
import { BoardNavComponent } from './components/white-board/board-nav/board-nav.component';
import { BoardSlideViewComponent } from './components/white-board/board-slide-view/board-slide-view.component';
import { BoardFileViewComponent } from './components/white-board/board-file-view/board-file-view.component';
import { BoardCanvasComponent } from './components/white-board/board-canvas/board-canvas.component';
import { BoardFabsComponent } from './components/white-board/board-fabs/board-fabs.component';
import { DragScrollDirective } from '../@wb/directives/drag-scroll.directive';
import { NgMaterialUIModule } from './ng-material-ui/ng-material-ui.module';

// icon
import { IconModule } from '@visurel/iconify-angular';


// Config
import { ENV } from './config/config';


// Guard
import { JwtModule } from '@auth0/angular-jwt';
import { SignInGuard } from './services/auth/signIn.guard';
import { MeetingGuard } from './services/meeting/auth/meeting.guard';

import { SignInComponent } from './components/auth/sign-in/sign-in.component';
import { RightSidebarComponent } from './components/right-sidebar/right-sidebar.component';
import { DeviceCheckComponent } from './components/device-check/device-check.component';
import { MeetingChatComponent } from './components/right-sidebar/meeting-chat/meeting-chat.component';
import { ParticipantComponent } from './components/right-sidebar/participant/participant.component';


export function tokenGetter() {
	return localStorage.getItem(ENV.tokenName);
}

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    WebRTCComponent,
    HeaderComponent,
    SidebarComponent,
    WhiteBoardComponent,
    BoardNavComponent,
    BoardSlideViewComponent,
    BoardFileViewComponent,
    BoardCanvasComponent,
    BoardFabsComponent,
    DragScrollDirective,
    SignInComponent,
    RightSidebarComponent,
    DialogUpdateBitrateComponent,
    DeviceCheckComponent,
    MeetingChatComponent,
    ParticipantComponent,
  ],
  imports: [
    MatToolbarModule,
    BrowserModule,
    MatIconModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    NgMaterialUIModule,
    FormsModule,
    HttpClientModule,
    FileUploadModule,
    ReactiveFormsModule,
    IconModule, // icon
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        disallowedRoutes: [
          '/apim/v1/auth/sign-in',
        ]
      }
    }),

  ],
  providers: [SignInGuard, MeetingGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }
