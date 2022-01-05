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

  devicesForm: FormGroup;

  miceDevices: any = [];;
  videoDevices: any = [];
  speakerDevices: any = [];
  devicesInfo:any;
  selectedMiceDevice: any;
  selectedVideoDevice: any;
  selectedSpeakerDevice: any;
  selectedDevices: any;
  audioDeviceExist:boolean = true;
  videoDeviceExist:boolean = true;

  private unsubscribe$ = new Subject<void>();
  constructor(
    private eventBusService: EventBusService,
    public fb: FormBuilder,
    private devicesInfoService: DevicesInfoService,
  ) {

  }

  ngOnInit(): void {
    // 유효성 검사
    this.devicesForm = this.fb.group({
      miceDevice: [null],
      videoDevice: [null],
      speakerDevice: [null],
    });




   
    // 디바이스 장치 변경 시 
    this.deviceCheck();
    

    this.eventBusService.on("device_Check", this.unsubscribe$, (data) => {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        console.log('-------------------- device list ------------------------');
        this.miceDevices = []
        this.videoDevices = []
        this.speakerDevices = []
        this.convertDeviceObject(devices)
        this.checkDevice(devices)
      }).catch(function (err) {
        console.log(err.name + ": " + err.message);
      });;
    })
  }

  // 모든 미디어 장치 분리해서 Object로 저장
  convertDeviceObject(devices) {
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

  deviceCheck(){
  // device check
    // https://developer.mozilla.org/ko/docs/Web/API/MediaDevices/enumerateDevices
    // https://webrtc.org/getting-started/media-devices#using-promises
    // https://simpl.info/getusermedia/sources/
    // https://levelup.gitconnected.com/share-your-screen-with-webrtc-video-call-with-webrtc-step-5-b3d7890c8747
    navigator.mediaDevices.enumerateDevices().then(async (devices) => {
      console.log('-------------------- device list ------------------------');
      this.convertDeviceObject(devices)
      this.checkDevice(devices)

      console.log(this.miceDevices)
      console.log(this.videoDevices)
      console.log(this.speakerDevices)
      this.devicesInfo = {
        miceDevices : this.miceDevices,
        videoDevices : this.videoDevices,
        speakerDevices : this.speakerDevices,
        audioDeviceExist : this.audioDeviceExist,
        videoDeviceExist : this.videoDeviceExist
      }
      console.log(this.devicesInfo)
      this.eventBusService.emit(new EventData('devicesInfo', this.devicesInfo ))
      this.devicesInfoService.setDevicesInfo(this.devicesInfo);
      
    }).catch(function (err) {
      console.log(err.name + ": " + err.message);
    });;

  }

  deviceChangeCheck(){
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

  checkDevice(devices) {
    if (this.miceDevices.length < 1 || (this.miceDevices[0]?.label && this.miceDevices.miceDevices[0]?.kind == 'audioinput')) {
      this.audioDeviceExist = false
    }
    if (this.videoDevices.length < 1 || (this.videoDevices[0]?.label && this.videoDevices.miceDevices[0]?.kind == 'videoinput')) {
      this.videoDeviceExist = false
    }
  }


  // selectMiceDevice() {
  //   console.log(this.selectedMiceDevice)
  //   this.eventBusService.emit(new EventData('selectMiceDevice', this.selectedMiceDevice))
  // }
  // selectVideoDevice() {
  //   console.log(this.selectedVideoDevice)
  //   this.eventBusService.emit(new EventData('selectVideoDevice', this.selectedVideoDevice?.id))
  // }
  // selectSpeakerDevice() {
  //   console.log(this.selectedSpeakerDevice)
  //   this.eventBusService.emit(new EventData('selectSpeakerDevice', this.selectedSpeakerDevice))
  // }
  selectDevice(){
    console.log('-------------device Change ---------------')
    console.log(this.miceDevices)
    console.log(this.videoDevices)
    console.log(this.speakerDevices)
    this.eventBusService.emit(new EventData('selectDevice',{
      selectedVideoDeviceId : this.selectedVideoDevice?.id,
      selectedMiceDeviceId : this.selectedMiceDevice?.id,
      selectedSpeakerDeviceId : this.selectedSpeakerDevice?.id,
    }))
  }

  joinMeetingRoom() {
    console.log(this.devicesForm.value)
    

    this.eventBusService.emit(new EventData('deviceCheck', this.devicesForm.value))
  }



}
