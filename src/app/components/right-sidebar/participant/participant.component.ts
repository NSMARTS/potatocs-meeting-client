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
    public myRole;

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

        // 참여자별 상태 정보 가져오기
        this.getParticipantState();


        /////////////////////////////////////////////////////////////
        // 참여자가 나갈 때 체크
        this.eventBusService.on("participantLeft", this.unsubscribe$, (data) => {

            // userId와 meetingId를 이용하여 on/offLine 판단
            const userOnlineData = {
                meetingId: this.meetingId,
                userId: data.userId
            }

            // 새로 들어온 참여자들 online: false로
            this.meetingService.getOnlineFalse(userOnlineData).subscribe(() => {

                // 참여자별 상태 정보 가져오기
                this.getParticipantState();
            })
            
                
                // 참여자가 나가면 role 'Presenter'로 초기화
                const userRoleData = {
                    meetingId: this.meetingId,
                    userId: data.userId,
                    role: 'Presenter'
                }

                this.meetingService.getRoleUpdate(userRoleData).subscribe(() => {            
                })
        })
        /////////////////////////////////////////////////////////////

        

        /////////////////////////////////////////////////////////////
        // 자신의 role 업데이트 시 자신을 제외한 같은 room (meetingId로 판단)에 있는 사람들 role 업데이트
        this.socket.on('refreshRole', () => {
            this.getParticipantState();
        })
        /////////////////////////////////////////////////////////////


        // 참여자가 나가면 role 'Presenter'로 초기화
        const userRoleData = {
            meetingId: this.meetingId,
            userId: this.userId ,
            role: 'Presenter'
        }

        this.meetingService.getRoleUpdate(userRoleData).subscribe(() => {            
        })
    }


    ngAfterViewInit(): void {

        /////////////////////////////////////////////////////////////
        // 새로운 참여자가 들어오면 실시간 체크
        this.eventBusService.on('updateParticipants', this.unsubscribe$, async (userId) => {

            this.participants = Object.keys(userId);

            // userId와 meetingId를 이용하여 on/offLine 판단
            const userOnlineData = {
                meetingId: this.meetingId,
                userId: this.participants
            }

            // 새로 들어온 참여자들 online: true로
            this.meetingService.getOnlineTrue(userOnlineData).subscribe(() => {

                // 참여자별 상태 정보 가져오기
                this.getParticipantState();
            })
        })
        /////////////////////////////////////////////////////////////
    }


    /////////////////////////////////////////////////////////////
    // 참여자별 상태 정보 가져오기
    getParticipantState() {

        const meetingId = this.meetingId
        this.meetingService.getParticipantState({ meetingId }).subscribe((data) => {
            this.currentMembers = [];

            this.currentMembers = data[0].currentMembers // console [{…}, {…}, {…}, {…} ...] 

            // meetingInfo.enlistedMembers와 현재 currentMembers의 userId값 비교 후 
            // 같은 userId를 찾으면 currentMembers[index]에 본인의 이름을 추가해준다.
            this.meetingInfo.enlistedMembers.forEach((enlistedMembers, index) => {
                this.currentMembers.forEach(currentMembers => {
                    if (enlistedMembers._id == currentMembers.member_id) {
                        this.currentMembers[index].name = this.meetingInfo.enlistedMembers[index].name
                    }

                });
            });
        })
    }
    /////////////////////////////////////////////////////////////



    /////////////////////////////////////////////////////////////
    // role 변경
    chooseRole(role, i) {
        this.currentMembers[i].role = role;

        const userRoleData = {
            meetingId: this.meetingId,
            userId: this.userId,
            role: role
        }

        // userId와 meetingId를 이용하여 role 업데이트
        this.meetingService.getRoleUpdate(userRoleData).subscribe(() => {

            // 본인 role 업데이트 시 같은 room의 다른 사람도 실시간으로 상대방 role 업데이트
            this.socket.emit('roleUpdate', this.meetingId);


            // 본인 state만 찾아서 Participant일 경우 권한 막기
            this.currentMembers.forEach((element, index) => {
                if (element.member_id == this.userId) {
                    const data = {
                        role : element.role
                    }
                    this.myRole = data;
                    this.eventBusService.emit(new EventData('myRole', data));
                }
            });
        })


    }
    /////////////////////////////////////////////////////////////
    


}

