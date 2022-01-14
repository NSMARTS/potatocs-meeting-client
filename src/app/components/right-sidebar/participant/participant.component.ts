import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { EventData } from 'src/@wb/services/eventBus/event.class';
import { MeetingInfoService } from 'src/@wb/store/meeting-info.service';
import { MeetingService } from 'src/app/services/meeting/meeting.service';
import { SocketioService } from '../../../services/socketio/socketio.service';

@Component({
    selector: 'app-participant',
    templateUrl: './participant.component.html',
    styleUrls: ['./participant.component.scss']
})
export class ParticipantComponent implements OnInit {

    private unsubscribe$ = new Subject<void>();
    private socket;


    participants = []; // 현재 접속 중인 참여자
    enlistedMembers = []; // 미팅에 허가 된 멤버들
    enlistedMember_check = []; // li의 이름들을 담은 배열
    checkName = []; // li(enlistedMember)와 현재 접속 중인 참여자 비교할 배열

    members = [];
    myName;
    userName;
    meetingInfo;

    public meetingId;
    public userId;
    public currentMembers;

    @ViewChildren('enlistedMember_span') public enlistedMember_spanRef: QueryList<ElementRef>;

    constructor(
        private eventBusService: EventBusService,
        private meetingInfoService: MeetingInfoService,
        private meetingService: MeetingService,
        private socketService: SocketioService,
    ) {
        this.socket = socketService.socket;
    }

    ngOnInit(): void {



        // 실시간으로 meeitngInfo를 바라보고 있다.
        this.meetingInfoService.state$
            .pipe(takeUntil(this.unsubscribe$)).subscribe((meetingInfo) => {
                this.meetingInfo = meetingInfo
                if (meetingInfo) {
                    console.log('[[ meetingInfo ]]', meetingInfo)
                    this.meetingId = meetingInfo._id;
                    this.userId = meetingInfo.userData._id;
                    this.myName = meetingInfo.userData.name;
                }
            });

        // 사용자별 권한 가져오기
        this.getRole();

        this.eventBusService.on("participantLeft", this.unsubscribe$, (data) => {
       
            // userId와 meetingId를 이용하여 on/offLine 판단
            const userOnlineData = {
                meetingId : this.meetingId,
                userId : data.userId
            }

            // 새로 들어온 참여자들 online: false로
            this.meetingService.getOnlineFalse(userOnlineData).subscribe((data)=> {

                // 사용자별 권한 다시 가져오기
                this.getRole();

                console.log(this.currentMembers)
            })
        })

    }


    ngAfterViewInit(): void {

        // 새로운 참여자가 들어오면 실시간 체크
        this.eventBusService.on('updateParticipants', this.unsubscribe$, async (userId) => {

            this.participants = Object.keys(userId);
            console.log(this.participants)

            // userId와 meetingId를 이용하여 on/offLine 판단
            const userOnlineData = {
                meetingId : this.meetingId,
                userId : this.participants
            }

            // 새로 들어온 참여자들 online: true로
            this.meetingService.getOnlineTrue(userOnlineData).subscribe((data)=> {

                // 사용자별 권한 다시 가져오기
                this.getRole();

                console.log(this.currentMembers)
            })
        })
    }



    // 역할 [ Presenter / Participant ] 을 선택하면 변경
    chooseRole(role, i) {
        // this.members[i].role = role;

        // const meetingInfo = {
        //     role: this.members
        // }
        // console.log(meetingInfo)

        // // 역할을 meetingInfo에 저장
        // this.meetingInfoService.setMeetingInfo(meetingInfo);

        // // 역할 선택 시 onLine / offLine user 판단
        // this.eventBusService.emit(new EventData('updateParticipants', this.userName));
        // console.log(this.userName)
    }


    getRole() {
        
        const meetingId = this.meetingId
        this.meetingService.getRole({ meetingId }).subscribe((data) => {
            this.currentMembers = [];

            // [{…}, {…}, {…}, {…} ...]
            this.currentMembers = data[0].currentMembers
   
            this.meetingInfo.enlistedMembers.forEach((enlistedMembers, index)=> {
                this.currentMembers.forEach(currentMembers => {
                    if(enlistedMembers._id == currentMembers.member_id){
                        this.currentMembers[index].name = this.meetingInfo.enlistedMembers[index].name
                    }
                    
                });
            });
        })

    }
}

