import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { EventData } from 'src/@wb/services/eventBus/event.class';

@Component({
  selector: 'app-device-check',
  templateUrl: './device-check.component.html',
  styleUrls: ['./device-check.component.scss']
})
export class DeviceCheckComponent implements OnInit {
  video: HTMLVideoElement;

  devicesForm: FormGroup;

  miceDevices: any = [];;
  videoDevices: any = [];
  speakerDevices: any = [];

  selectedMiceDevice: any;
  selectedVideoDevice: any;
  selectedSpeakerDevice: any;
  selectedDevices: any;

  private unsubscribe$ = new Subject<void>();
  constructor(
    private eventBusService: EventBusService,
    public fb: FormBuilder
  ) {

  }

  ngOnInit(): void {
    // 유효성 검사
    this.devicesForm = this.fb.group({
      miceDevice: [null],
      videoDevice: [null],
      speakerDevice: [null],
    });
    



    // device check
    // https://developer.mozilla.org/ko/docs/Web/API/MediaDevices/enumerateDevices
    // https://webrtc.org/getting-started/media-devices#using-promises
    // https://simpl.info/getusermedia/sources/
    // https://levelup.gitconnected.com/share-your-screen-with-webrtc-video-call-with-webrtc-step-5-b3d7890c8747
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      console.log('-------------------- device list ------------------------');
      this.convertDeviceObject(devices)

      console.log(this.miceDevices)
      console.log(this.videoDevices)
      console.log(this.speakerDevices)

      this.checkDevice(devices)
    }).catch(function(err) {
      console.log(err.name + ": " + err.message);
    });;

    // 디바이스 장치 변경 시 
    navigator.mediaDevices.addEventListener('devicechange', async event => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      // 초기화
      this.miceDevices = []
      this.videoDevices = []
      this.speakerDevices = []
      this.convertDeviceObject(devices)
      this.checkDevice(devices)
    });
    
  }

  // 모든 미디어 장치 분리해서 Object로 저장
  convertDeviceObject(devices){
    devices.forEach((device) => {
      if (device.kind == 'audioinput') {
        this.miceDevices.push({ kind: device.kind, label: device.label, id: device.deviceId });
      } else if (device.kind == 'videoinput') {
        this.videoDevices.push({ kind: device.kind, label: device.label, id: device.deviceId });
      } else if (device.kind == 'audiooutput') {
        this.speakerDevices.push({ kind: device.kind, label: device.label, id: device.deviceId });
      }
    })
    //
    this.selectedMiceDevice = this.miceDevices[0];
    this.selectedVideoDevice = this.videoDevices[0];
    this.selectedSpeakerDevice = this.speakerDevices[0];
  }

  checkDevice(devices){
      // 장치 존재 유무
      console.log('-------------------- device list ------------------------');
      console.log(devices);
      // https://goodmemory.tistory.com/73
      const speakerDevice = devices.some(item => item.kind == 'audiooutput')
      // console.log(speakerDevice)
      // if (!speakerDevice) { alert('스피커 장치가 존재하지 않습니다.') }
      const videoDevice = devices.some(item => item.kind == 'videoinput')
      // console.log(videoDevice)
      // if (!videoDevice) { alert('캠코더 장치가 존재하지 않습니다.') }
      const miceDevice = devices.some(item => item.kind == 'audioinput')
      // console.log(miceDevice)
      // if (!miceDevice) { alert('마이크 장치가 존재하지 않습니다.') }
      console.log('---------------------------------------------------------');

      // 장치 권한 유무 == device.label 이 없으면 권한이 없다.
      devices.forEach((device) => {
        if (device.kind == 'audioinput' && !device.label) {
          // console.log('audio 권한이 없습니다.')
          // alert('마이크 권한이 없습니다.')
        } else if (device.kind == 'videoinput' && !device.label) {
          // console.log('video 권한이 없습니다.')
          // alert('비디오 권한이 없습니다.')
        }
        // console.log(device.kind + ': ' + device.label + ' id = ' + device.deviceId);
      });
  }

  selectMiceDevice() {
    console.log(this.selectedMiceDevice)
    this.eventBusService.emit(new EventData('selectMiceDevice', this.selectedMiceDevice))
  }
  selectVideoDevice() {
    console.log(this.selectedVideoDevice)
    this.eventBusService.emit(new EventData('selectVideoDevice', this.selectedVideoDevice?.id))
  }
  selectSpeakerDevice() {
    console.log(this.selectedSpeakerDevice)
    this.eventBusService.emit(new EventData('selectSpeakerDevice', this.selectedSpeakerDevice))
  }

  joinMeetingRoom() {
    console.log(this.devicesForm.value)

    this.eventBusService.emit(new EventData('deviceCheck', this.devicesForm.value))
  }



}
