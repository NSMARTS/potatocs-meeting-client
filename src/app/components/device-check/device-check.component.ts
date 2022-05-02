import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { DevicesInfoService } from 'src/@wb/store/devices-info.service';
import { EventData } from 'src/@wb/services/eventBus/event.class';
import { MeetingService } from 'src/app/services/meeting/meeting.service';
import { ActivatedRoute } from '@angular/router';
import { WebRTCService } from 'src/app/services/webRTC/web-rtc.service';

@Component({
    selector: 'app-device-check',
    templateUrl: './device-check.component.html',
    styleUrls: ['./device-check.component.scss']
})
export class DeviceCheckComponent implements OnInit {
    miceDevices: any = [];
    videoDevices: any = [];
    speakerDevices: any = [];
    devicesInfo: any;
    selectedMiceDevice: any;
    selectedVideoDevice: any;
    selectedSpeakerDevice: any;
    selectedDevices: any;
    audioDeviceExist: boolean = true;
    videoDeviceExist: boolean = true;

    isChecked: any;
    cameraOn: boolean = true;
    cameraOff: boolean = false;

    meetingId;
    meetingClose = false;

    browserInfo: any;
    browserVersion: any;

    localStream$;

    private unsubscribe$ = new Subject<void>();


    // @ViewChild('video') public videoRef: ElementRef;
    // get video(): HTMLVideoElement {
    // 	return this.videoRef.nativeElement;
    // }


    @ViewChild('video', { static: true }) public videoRef: ElementRef;
    video: any;
    constructor(
        private eventBusService: EventBusService,
        public fb: FormBuilder,
        private devicesInfoService: DevicesInfoService,
        private meetingService: MeetingService,
        private route: ActivatedRoute,
        private webrtcService: WebRTCService
    ) {
        this.localStream$ = this.webrtcService.localStream$;
    }

    ngOnInit() {

        this.meetingId = this.route.snapshot.params['id'];
        this.video = this.videoRef.nativeElement;
        // 브라우저 체크
        this.browserCheck();
        // 웹캠으로 부터 스트림 추출
        this.getLocalMediaStream();
        // 컴퓨터에 연결된 장치 목록
        this.deviceCheck();
        // 컴퓨터에 연결된 장치 추가/제거 시 실시간으로 목록 수정
        this.deviceChangeCheck();
    }



    // 컴퓨터에 연결된 장치 목록
    async deviceCheck() {
        // https://developer.mozilla.org/ko/docs/Web/API/MediaDevices/enumerateDevices
        // https://webrtc.org/getting-started/media-devices#using-promises
        // https://simpl.info/getusermedia/sources/
        // https://levelup.gitconnected.com/share-your-screen-with-webrtc-video-call-with-webrtc-step-5-b3d7890c8747
        await navigator.mediaDevices.enumerateDevices().then(async (devices) => {
            console.log('-------------------- device list ------------------------');
            console.log(devices)
            // 장치 목록 객체화
            this.convertDeviceObject(devices)
            console.log(this.miceDevices)
            console.log(this.videoDevices)
            console.log(this.speakerDevices)
            // 장치 연결, 권한 유무
            this.checkDevice()
            
            this.selectDevice();
        }).catch(function (err) {
            console.log(err);
        });
    }

    // 컴퓨터에 연결된 장치 추가/제거 시 실시간으로 목록 변경
    deviceChangeCheck() {
        navigator.mediaDevices.addEventListener('devicechange', async event => {
            const devices = await navigator.mediaDevices.enumerateDevices();
            await this.convertDeviceObject(devices)
            this.checkDevice()
            this.selectDevice();
        });
    }


    // 모든 미디어 장치 분리해서 Object로 저장
    convertDeviceObject(devices) {
        // 장치값 초기화

        this.miceDevices = []
        this.videoDevices = []
        this.speakerDevices = []

        devices.forEach((device) => {
            if (device.kind == 'audioinput') {
                this.miceDevices.push({ kind: device.kind, label: device.label, id: device.deviceId });
            } else if (device.kind == 'videoinput') {
                this.videoDevices.push({ kind: device.kind, label: device.label, id: device.deviceId });
            } else if (device.kind == 'audiooutput') {
                this.speakerDevices.push({ kind: device.kind, label: device.label, id: device.deviceId });
            }
        })

        this.selectedMiceDevice = this.miceDevices[0];
        this.selectedVideoDevice = this.videoDevices[0];
        this.selectedSpeakerDevice = this.speakerDevices[0];
    }

    // 장치의 연결 유무
    checkDevice() {
        
        if (!this.miceDevices[0].id) {
            this.audioDeviceExist = false
        }
        if (!this.videoDevices[0].id) {
            this.videoDeviceExist = false
        }
    }

    // select 창에서 장치를 선택하거나, 목록이 바뀌었을 경우 실행 
    selectDevice() {
        console.log('-------------device Change ---------------')
        this.devicesInfo = {
            selectedVideoDeviceId: this.selectedVideoDevice?.id,
            selectedMiceDeviceId: this.selectedMiceDevice?.id,
            selectedSpeakerDeviceId: this.selectedSpeakerDevice?.id,
            audioDeviceExist: this.audioDeviceExist,
            videoDeviceExist: this.videoDeviceExist
        }
        console.log(this.devicesInfo)
        this.devicesInfoService.setDevicesInfo(this.devicesInfo);
        this.changeMediaStream();

        console.log(this.video)
        console.log(this.selectedSpeakerDevice);
        if (typeof this.video.sinkId !== 'undefined') {
            this.video.setSinkId(this.selectedSpeakerDevice?.id).then(() => {
                console.log('succes speaker device')
            })
                .catch(error => {
                    console.log(error)
                })
        }
    }



    // device check 화면에서 카메라 On / Off 유무
    checkValue(event: any) {
        if(event == false) {
            this.videoDeviceExist = false;
            // 로컬 미디어 스트림 변경
            this.getLocalMediaStream();
            // web-rtc 컴포넌트에 있는 비디오 스트림 설정 변경
            this.selectDevice();
        } else {           
            this.videoDeviceExist = true;
            this.getLocalMediaStream();
            this.selectDevice();
        }
    }



    // 채널 참가 main component로 이동
    joinMeetingRoom() {
        this.eventBusService.emit(new EventData('join', ''));
        this.eventBusService.emit(new EventData('deviceCheck', ''))
    }

    // video에 스트림 추출
    async getLocalMediaStream() {
        const options = { 
                audio: {
                'echoCancellation': true,
                'noiseSuppression': true,
                }, 
                video: true 
        };

        console.log(options)
        try {
            await this.webrtcService.getMediaStream(options);
            // 브라우저가 장치의 권한 부여 시 목록 수정
            await navigator.mediaDevices.enumerateDevices().then(async (devices) => {
                await this.convertDeviceObject(devices)
                this.checkDevice()
            }).catch(function (err) {
                console.log(err);
            });
        } catch (e) {
            console.log(e);
        }
    }

    // select에서 장치 변경 시 stream 변경
    // 권한 확인 유무 관련해서 이슈때문에 change시 새로운 함수 사용
    async changeMediaStream() {
        // const options = { audio: true, video: true };
        const options = {
            audio:
                this.audioDeviceExist ? {
                    'echoCancellation': true,
                    'noiseSuppression': true,
                    deviceId: this.selectedMiceDevice?.id,
                } :
                    false,
            video: this.videoDeviceExist ? {
                deviceId: this.selectedVideoDevice?.id,
                width: 320,
                framerate: { max: 24, min: 24 }
            } : false
        };

        console.log(options)
        try {
            await this.webrtcService.getMediaStream(options);
        } catch (e) {
            console.log(e);
        }
    }


    // 브라우저 체크
    browserCheck() {
        var userAgent = navigator.userAgent;
        var reg = null;
        var browser = {
            name: null,
            version: null
        };

        userAgent = userAgent.toLowerCase();

        if (userAgent.indexOf("opr") !== -1) {
            reg = /opr\/(\S+)/;
            browser.name = "Opera";
            // browser.version = reg.exec(userAgent)[1];
            browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf('.'));

        } else if (userAgent.indexOf("edge") !== -1) {
            reg = /edge\/(\S+)/;
            browser.name = "Edge";
            browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf('.'));
        } else if (userAgent.indexOf("chrome") !== -1) {
            reg = /chrome\/(\S+)/;
            browser.name = "Chrome";
            browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf('.'));
        } else if (userAgent.indexOf("safari") !== -1) {
            reg = /safari\/(\S+)/;
            browser.name = "Safari";
            browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf('.'));
        } else if (userAgent.indexOf("firefox") !== -1) {
            reg = /firefox\/(\S+)/;
            browser.name = "Firefox";
            browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf('.'));
        } else if (userAgent.indexOf("trident") !== -1) {
            browser.name = "IE";

            if (userAgent.indexOf("msie") !== -1) {
                reg = /msie (\S+)/;
                browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf('.'));
                browser.version = browser.version.replace(";", "");
            } else {
                reg = /rv:(\S+)/;
                browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf('.'));
            }
        }

        return this.browserInfo = browser;
    }


}
