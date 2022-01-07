import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MeetingInfoService } from 'src/@wb/store/meeting-info.service';
import { MeetingService } from 'src/app/services/meeting/meeting.service';
import { SocketioService } from 'src/app/services/socketio/socketio.service';


@Component({
    selector: 'app-meeting-chat',
    templateUrl: './meeting-chat.component.html',
    styleUrls: ['./meeting-chat.component.scss']
})
export class MeetingChatComponent implements OnInit {

    private socket;
    private unsubscribe$ = new Subject<void>();
    
    public chatInMeeting = [];
    public meetingTitle;
    public meetingId;
    public userId;
    public userName;
    public chatContent;
    

    @ViewChild('target') private myScrollContainer: ElementRef;
    scrolltop: number = null;

    constructor(
        private socketService: SocketioService,
        private meetingInfoService: MeetingInfoService,
        private meetingService: MeetingService,
    ) {
        this.socket = socketService.socket;
     }

    ngOnInit(): void {

        // 현재 meeting에 접속 중인 유저정보, 미팅정보 가져오기
        this.meetingInfoService.state$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((meetingInfo) => {
                if (meetingInfo) {
                    console.log(meetingInfo)
                    this.meetingTitle = meetingInfo.meetingTitle;
                    this.meetingId = meetingInfo._id;
                    this.userId = meetingInfo.userData._id;
                    this.userName = meetingInfo.userData.name;
            }
        });


        this.getMeetingChat(this.meetingId);


        this.socket.on('receiveChatData', (chatData) => {
            console.log(chatData)
            // 받아온 채팅 객체 배열에 넣기
            this.chatInMeeting.push(chatData)
        });
    
        
        
    }



    // 채팅 생성
    createChat() {
        console.log(this.chatContent)
        
        const data = {
            meetingTitle : this.meetingTitle,
            meetingId: this.meetingId,
            userId: this.userId,
            chatMember: this.userName,
            chatContent: this.chatContent
        }

        this.meetingService.createChat(data).subscribe((data)=> {
            this.socket.emit('sendChat', data);
        })

        this.chatContent = '';
    }


    // 늦게 들어온 사람도 현재까지 대화 불러오기
    getMeetingChat(meetingId) {
        this.meetingService.getMeetingChat({meetingId}).subscribe((meetingChat)=> {

            // Object로 와서
            var chat = Object.values(meetingChat);
          
            chat.forEach(element => {
                console.log(element)
                // 받아온 채팅 객체 배열에 넣기
                this.chatInMeeting.push(element)
            });

            console.log('불러오기', this.chatInMeeting)
        })
    }


    // 본인 채팅 지우기
    deleteChat(chatId) {
        console.log(chatId)
    }

 
    
    scrollToBottom(): void {
        try {
          this.scrolltop = this.myScrollContainer.nativeElement.scrollHeight;
        } catch (err) { }
      }
}
