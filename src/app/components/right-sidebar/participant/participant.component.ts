import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { EventData } from 'src/@wb/services/eventBus/event.class';
import { MeetingInfoService } from 'src/@wb/store/meeting-info.service';

@Component({
    selector: 'app-participant',
    templateUrl: './participant.component.html',
    styleUrls: ['./participant.component.scss']
})
export class ParticipantComponent implements OnInit {

    private unsubscribe$ = new Subject<void>();

    participants = []; // 현재 접속 중인 참여자
    enlistedMembers = []; // 미팅에 허가 된 멤버들
    enlistedMember_check = []; // li의 이름들을 담은 배열
    checkName = []; // li(enlistedMember)와 현재 접속 중인 참여자 비교할 배열

    role = 'Presenter';

    members = [];
    myName;
    userName;

    onLine;
    offLine;

    itemIndex = [];

    @ViewChildren('enlistedMember_span') public enlistedMember_spanRef: QueryList<ElementRef>;

    constructor(
        private eventBusService: EventBusService,
        private meetingInfoService: MeetingInfoService,
    ) { }

    ngOnInit(): void {



        // 실시간으로 meeitngInfo를 바라보고 있다.
        this.meetingInfoService.state$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((meetingInfo) => {
                if (meetingInfo) {
                    console.log('[[ meetingInfo ]]', meetingInfo)

                    this.members = [];
                    this.myName = meetingInfo.userData.name;

                    for (let index = 0; index < meetingInfo.enlistedMembers.length; index++) {
                        if(!meetingInfo.role){
                            const member = {
                                name: meetingInfo.enlistedMembers[index].name,
                                role: this.role
                            }
                            this.members.push(member)
                        }else {
                            const member = {
                                name: meetingInfo.enlistedMembers[index].name,
                                role: meetingInfo.role[index].role
                            }
                            this.members.push(member)
                            
                        }
                    }
                }
            });



        // // 실시간으로 meeitngInfo를 바라보고 있다.
        // this.meetingInfoService.state$
        //   .pipe(takeUntil(this.unsubscribe$))
        //   .subscribe((meetingInfo) => {
        //     if (meetingInfo) {
        //       this.enlistedMembers = [];

        //       console.log('[[ meetingInfo ]]', meetingInfo)

        //       meetingInfo.enlistedMembers.forEach(element => {
        //         // console.log(element.name)
        //         this.member.push(element.name)

        //       });
        //       console.log(this.enlistedMembers)

        //     }
        //   });
    }


    ngAfterViewInit(): void {


        /***************************************************************
        *  1.     
        *  this.enlistedMember_spanRef.toArray()와 현재 접속중인 참여자
        *  이름 교집합 찾아서 enlistedMember_check 배열에 담기                       
        *****************************************************************/
        this.enlistedMember_spanRef.toArray().forEach(element => {

            const innerText = element.nativeElement.innerText
            this.enlistedMember_check.push(innerText)

            // console.log(this.enlistedMember_check)
        })
        

        // 새로운 참여자가 들어오면
        this.eventBusService.on('updateParticipants', this.unsubscribe$, async (userName) => {
            
            this.itemIndex = [];
            this.participants = Object.keys(userName);
       

            /*************************************************************** 
            *  2.    
            *  this.enlistedMember_spanRef.toArray()와 현재 접속중인 참여자
            *  이름 교집합 찾아서 checkName 배열에 담기                       
            *****************************************************************/
            this.checkName = this.enlistedMember_check.filter(userName => this.participants.includes(userName))

            /***************************************************************   
            *  3. 
            *  this.enlistedMember_spanRef.toArray()에서 이름 교집합을 찾아서
            *  값이 있으면 클레스네임 추가                      
            *****************************************************************/            
            await this.enlistedMember_spanRef.toArray().forEach(element => {

                const innerText = element.nativeElement.innerText // 이름                
                
                // 교집합과 li.innerText와 비교하여 return 0, -1 
                const itemIndex = this.checkName.findIndex((item) => item === innerText);

                this.itemIndex.push(itemIndex);
                
                // 이름이 있으면 클레스 네임추가
                for (let index = 0; index < this.itemIndex.length; index++){
                    if (this.itemIndex[index] >= 0) {
                            return 'onLine'
                        } else {
                            return 'offLine'
                        }
                    
                }                
            })
            
        })
    }

    

    // 역할을 선택하면 변경
    chooseRole(role, i) {
        this.members[i].role = role;
        console.log(this.members[i])


        const meetingInfo = {
            role: this.members
        }
        console.log(meetingInfo)
        this.meetingInfoService.setMeetingInfo(meetingInfo);

        this.eventBusService.emit(new EventData('updateParticipants', this.userName));
        console.log(this.userName)
    }


}
