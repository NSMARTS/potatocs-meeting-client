import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { EventData } from 'src/app/services/eventBus/event.class';
import { ParticipantsService } from 'src/app/services/participants/participants.service';
import { SocketioService } from 'src/app/services/socketio/socketio.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  private unsubscribe$ = new Subject<void>();
  private socket;
  video: any;
  sharing = false;
  stream: any;
  shareIcon = 'videocam_on';

  whiteBoardMode = false;
  whiteBoardIcon = 'border_color';


  constructor(
    private socketService: SocketioService,
    private participantsService: ParticipantsService,
    private eventBusService: EventBusService,
  ) { 
    this.socket = socketService.socket;
  }



  @ViewChild('sharingBtn') public sharingBtnRef: ElementRef;
	get sharingBtn(): HTMLButtonElement {
		return this.sharingBtnRef.nativeElement;
	}



  ngOnInit(): void {

 

    this.eventBusService.on('handleSharingCancel', this.unsubscribe$, ()=> {
      this.shareIcon = 'videocam_on'
      this.sharing = false;
    })

  }

  handleSharingClick() {
    this.eventBusService.emit(new EventData('handleSharingClick', ''))
    if (this.sharing) {
      this.shareIcon = 'videocam_on'
      this.sharing = false;
    } else {
      this.sharing = true;
      this.shareIcon = 'videocam_off'
    }
  }

  whiteBoardClick(){
    this.eventBusService.emit(new EventData('whiteBoardClick',''))
    
    if (this.whiteBoardMode == false) {
      this.whiteBoardMode = true;
      console.log('whiteBoard Mode On')
      this.whiteBoardIcon = 'desktop_mac'
      } else {
      this.whiteBoardMode = false
      console.log('whiteBoard Mode Off')
      this.whiteBoardIcon = 'border_color'
    }

  
  }
}
