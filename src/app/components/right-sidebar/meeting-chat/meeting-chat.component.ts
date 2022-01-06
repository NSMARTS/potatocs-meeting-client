import { Component, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MeetingInfoService } from 'src/@wb/store/meeting-info.service';

@Component({
    selector: 'app-meeting-chat',
    templateUrl: './meeting-chat.component.html',
    styleUrls: ['./meeting-chat.component.scss']
})
export class MeetingChatComponent implements OnInit {

    private unsubscribe$ = new Subject<void>();

    public chatContent;
    public chatInMeeting = [];
    public userId;
    public meetingId;


    constructor(
        private meetingInfoService: MeetingInfoService
    ) { }

    ngOnInit(): void {

        // 현재 meeting에 접속 중인 유저 아이디 가져오기
        this.meetingInfoService.state$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((meetingInfo) => {
                if (meetingInfo) {
                    this.meetingId = meetingInfo._id
                    this.userId = meetingInfo.userData._id;
            }
        });
    }



    // 채팅 생성
    createChat() {
        console.log(this.chatContent)
        
        const data = {
            MeetingId: this.meetingId,
            userId: this.userId,
            chatContent: this.chatContent
        }

        
        this.chatContent = '';
    }
}
