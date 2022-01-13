import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { EventData } from 'src/@wb/services/eventBus/event.class';
import { MeetingInfoService } from 'src/@wb/store/meeting-info.service';
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

    role = 'Presenter'


    @ViewChildren('enlistedMember_span') public enlistedMember_spanRef: QueryList<ElementRef>;

    constructor(
        private eventBusService: EventBusService,
        private meetingInfoService: MeetingInfoService,
        private socketService: SocketioService,
    ) { 
        this.socket = socketService.socket;
    }

    ngOnInit(): void {
        // this.socket.on("userId", (data) => {
        //     console.log(data)
        // })
        
        // 실시간으로 meeitngInfo를 바라보고 있다.
        this.meetingInfoService.state$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((meetingInfo) => {
                if (meetingInfo) {
                    console.log('[[ meetingInfo ]]', meetingInfo)

                    this.members = [];
                    this.myName = meetingInfo.userData.name;

                    // meetingInfo.role 여부 
                    // (user role 값 Presenter로 들어오자마자 저장하도록 변경예정)
                    for (let index = 0; index < meetingInfo.enlistedMembers.length; index++) {
                        if (!meetingInfo.role) {
                            const member = {
                                name: meetingInfo.enlistedMembers[index].name,
                                role: this.role
                            }
                            this.members.push(member)
                        } else {
                            const member = {
                                name: meetingInfo.enlistedMembers[index].name,
                                role: meetingInfo.role[index].role
                            }
                            this.members.push(member)

                        }
                    }
                }
            });
    }


    ngAfterViewInit(): void {

        // 새로운 참여자가 들어오면 실시간 체크
        this.eventBusService.on('updateParticipants', this.unsubscribe$, async (userName) => {

            // role 선택 시 이벤트버스 사용 위해 들어온 사람들 this.userName에 바로 저장
            this.userName = userName;
            this.participants = Object.keys(userName);

            console.log(userName)

            // 새로 들어오거나 나갈 때 object[index].onLine 초기화하고 다시 체크
            this.members.forEach((element, i)=> {
                delete this.members[i].onLine;
            })


            /************************************************
             * member 길이만큼 반복할 때 현재 참가자 배열 체크
             * member.name과 participants(현재 들어온 사람 name)가 같으면 
             * 해당 object[index]에 key:value 추가 
             *************************************************/
            this.members.forEach((member, index)=> {
                this.participants.forEach((onLineUser, j)=> {
                    if(member.name == onLineUser){
                        this.members[index].onLine = 'onLine'
                    } 
                   
                })
            })            
        })
    }



    // 역할 [ Presenter / Participant ] 을 선택하면 변경
    chooseRole(role, i) {
        this.members[i].role = role;

        const meetingInfo = {
            role: this.members
        }
        console.log(meetingInfo)

        // 역할을 meetingInfo에 저장
        this.meetingInfoService.setMeetingInfo(meetingInfo);

        // 역할 선택 시 onLine / offLine user 판단
        this.eventBusService.emit(new EventData('updateParticipants', this.userName));
        console.log(this.userName)
    }


}
