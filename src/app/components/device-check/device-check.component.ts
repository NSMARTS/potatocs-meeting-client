import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { DevicesInfoService } from 'src/@wb/store/devices-info.service';
import { EventData } from 'src/@wb/services/eventBus/event.class';

@Component({
  selector: 'app-device-check',
  templateUrl: './device-check.component.html',
  styleUrls: ['./device-check.component.scss']
})
export class DeviceCheckComponent implements OnInit {
  video: HTMLVideoElement;
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

  private unsubscribe$ = new Subject<void>();
  constructor(
    private eventBusService: EventBusService,
    public fb: FormBuilder,
    private devicesInfoService: DevicesInfoService,
  ) {

  }

  ngOnInit(): void {
    // 컴퓨터에 연결된 장치 목록
    this.deviceCheck()
    // 컴퓨터에 연결된 장치 추가/제거 시 실시간으로 목록 수정
    this.deviceChangeCheck()
    // 브라우저가 장치의 권한 부여 시 목록 수정
    this.registerSocketListener()
  }

  // 컴퓨터에 연결된 장치 목록
  deviceCheck() {  
    // https://developer.mozilla.org/ko/docs/Web/API/MediaDevices/enumerateDevices
    // https://webrtc.org/getting-started/media-devices#using-promises
    // https://simpl.info/getusermedia/sources/
    // https://levelup.gitconnected.com/share-your-screen-with-webrtc-video-call-with-webrtc-step-5-b3d7890c8747
    navigator.mediaDevices.enumerateDevices().then(async (devices) => {
      console.log('-------------------- device list ------------------------');
      // 장치 목록 객체화
      this.convertDeviceObject(devices)
      // 장치 연결, 권한 유무
      this.checkDevice()

      console.log(this.miceDevices)
      console.log(this.videoDevices)
      console.log(this.speakerDevices)
      this.devicesInfo = {
        miceDevices: this.miceDevices,
        videoDevices: this.videoDevices,
        speakerDevices: this.speakerDevices,
        audioDeviceExist: this.audioDeviceExist,
        videoDeviceExist: this.videoDeviceExist
      }
      console.log(this.devicesInfo)
      this.devicesInfoService.setDevicesInfo(this.devicesInfo);
    }).catch(function (err) {
      console.log(err);
    });
  }

  // 컴퓨터에 연결된 장치 추가/제거 시 실시간으로 목록 변경
  deviceChangeCheck() {
    navigator.mediaDevices.addEventListener('devicechange', async event => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.convertDeviceObject(devices)
      this.checkDevice()
      this.selectDevice();
    });
  }

  registerSocketListener() {
    // 브라우저에게 권한을 줄 경우 목록 새로고침
    this.eventBusService.on("device_Check", this.unsubscribe$, (data) => {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        this.deviceCheck();
      }).catch(function (err) {
        console.log(err.name + ": " + err.message);
      });;
    })
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

  // 장치의 연결,권한 유무
  checkDevice() {
    console.log(this.miceDevices[0].id)
    if (this.miceDevices.length < 1 || (!this.miceDevices[0]?.label && this.miceDevices[0]?.kind == 'audioinput')) {
      this.audioDeviceExist = false
    }
    if (this.videoDevices.length < 1 || (!this.videoDevices[0]?.label && this.videoDevices[0]?.kind == 'videoinput')) {
      this.videoDeviceExist = false
    }
  }

  // select 창에서 장치를 선택하거나, 목록이 바뀌었을 경우 실행 
  selectDevice() {
    console.log('-------------device Change ---------------')
    this.eventBusService.emit(new EventData('selectDevice', {
      selectedVideoDeviceId: this.selectedVideoDevice?.id,
      selectedMiceDeviceId: this.selectedMiceDevice?.id,
      selectedSpeakerDeviceId: this.selectedSpeakerDevice?.id,
    }))
  }
  // 채널 참가 main component로 이동
  joinMeetingRoom() {
    this.eventBusService.emit(new EventData('deviceCheck', ''))
  }

}
