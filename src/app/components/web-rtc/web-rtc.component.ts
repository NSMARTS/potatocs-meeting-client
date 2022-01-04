import { AfterViewInit, Component, ElementRef, Injectable, NgModule, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { pluck, Subject, Subscription, takeUntil } from 'rxjs';

import adapter from 'webrtc-adapter';
import { SocketioService } from '../../services/socketio/socketio.service';
import { WebRTCService } from '../../services/webRTC/web-rtc.service';
import { WebRtcPeer } from 'kurento-utils';
import { io, Socket } from 'socket.io-client';
import { ParticipantsService } from 'src/app/services/participants/participants.service';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service'; 
import { ActivatedRoute } from '@angular/router';
import { MeetingInfoService } from 'src/@wb/store/meeting-info.service';
import { EventData } from 'src/@wb/services/eventBus/event.class';



@Component({
	selector: 'app-web-rtc',
	templateUrl: './web-rtc.component.html',
	styleUrls: ['./web-rtc.component.scss']
})
export class WebRTCComponent implements OnInit {
	roomName: any;
	meetingId: any;
	userName: any;
	name: any;
	userData: any;
	private subscription: Subscription;
	//   private socket: Socket;
	public localStream$;
	private socket;
	participants: any = {};
	stream: any;
	private unsubscribe$ = new Subject<void>();
	localStream:any;
	bitrate:any;

	muted = false;
	cameraOff = false;
	sharing = false;
	constraints:any = {};
	audioDeviceExist = true;
	videoDeviceExist = true;
	videoConstraints:any;
	whiteBoardMode = false // whiteBoard Mode Check

	@ViewChild('call') public callRef: ElementRef;
	get call(): HTMLDivElement {
		return this.callRef.nativeElement;
	}
	@ViewChild('muteBtn') public muteBtnRef: ElementRef;
	get muteBtn(): HTMLButtonElement {
		return this.muteBtnRef.nativeElement;
	}
	@ViewChild('cameraBtn') public cameraBtnRef: ElementRef;
	get cameraBtn(): HTMLButtonElement {
		return this.cameraBtnRef.nativeElement;
	}
	@ViewChild('sharingBtn') public sharingBtnRef: ElementRef;
	get sharingBtn(): HTMLButtonElement {
		return this.sharingBtnRef.nativeElement;
	}
	@ViewChild('settingBtn') public settingBtnRef: ElementRef;
	get settingBtn(): HTMLButtonElement {
		return this.settingBtnRef.nativeElement;
	}
	@ViewChild('leaveBtn') public leaveBtnRef: ElementRef;
	get leaveBtn(): HTMLButtonElement {
		return this.leaveBtnRef.nativeElement;
	}
	@ViewChild('video') public videoRef: ElementRef;
	get video(): HTMLVideoElement {
		return this.videoRef.nativeElement;
	}

	@ViewChildren('participants') public participantsRef: QueryList<ElementRef>;
	get participantsElement(): HTMLDivElement {
		return this.participantsRef.last.nativeElement;
	}



	constructor(
		private wetRtcService: WebRTCService,
		private socketService: SocketioService,
		private participantsService: ParticipantsService,
		private eventBusService: EventBusService,
		private route: ActivatedRoute,
		private meetingInfoService: MeetingInfoService,
	) {
		this.socket = socketService.socket;
		// this.localStream$ = this.wetRtcService.localStream$;

	}

	ngOnInit(): void {
		// step1: socket connection & join Room & register socket listener
		// todo: disconnect, reconnect를 위한 루틴 추가 필요
		this.registerSocketListener();


	}

	/**
		 * 1. Socket Listener 등록
		 *  실제로는 listener 해제도 추가해야함.
		 */
	private registerSocketListener() {
		// function newID() {
		// 	return Math.random().toString(36).substr(2, 16);
		// }
		// const roomName = "testRoom";
		// const userName = newID();
		// this.roomName = roomName;
		// this.userName = userName;
		// const userData = {
		// 	roomName: this.roomName,
		// 	userName: this.userName
		// }
		// console.log('유저 정보')
		// console.log(userData)

		///////////////////////////////////////////////////////////////////
		// Meeting Info 수신 후 해당 회의 내의
		// 문서, 판서 data store update

		this.meetingInfoService.state$
			.pipe(takeUntil(this.unsubscribe$))
			.subscribe((meetingInfo) => {
				if (meetingInfo) {
					const userData = {
						roomName: meetingInfo._id,
						userId: meetingInfo.userData._id,
						userName: meetingInfo.userData.name
					}
					this.roomName = meetingInfo._id
					this.userName = meetingInfo.userData.name
					console.log(userData)
					this.userData = userData

				}
			});
		/////////////////////////////////////////////////////////////////
		// const userData = {
		// 	roomName : this.meetingId,
		// 	userName : //api서비스에서 본인 pop 어쩌구써서 userName 가져오기,
		// 	userId : 
		// }



		this.socket.emit('userInfo', this.userData)

		// Socket Code
		this.socket.on("existingParticipants", async (data) => {
			this.onExistingParticipants(data);
			this.eventBusService.emit(new EventData('updateParticipants', this.participants))
		});
		this.socket.on("newParticipantArrived", async (data) => {
			this.onNewParticipant(data);
		});
		// 나중에 구현
		this.socket.on("participantLeft", async (data) => {
			console.log("participantLeft---------------")
			this.onParticipantLeft(data);
			this.eventBusService.emit(new EventData('updateParticipants', this.participants))

		});
		this.socket.on("receiveVideoAnswer", async (data) => {
			this.receiveVideoResponse(data);
		});
		this.socket.on("iceCandidate", async (data) => {
			this.participants[data.name].rtcPeer.addIceCandidate(data.candidate, function (error) {
				if (error) {
					console.error("Error adding candidate: " + error);
					return;
				}
			});
		});

		this.socket.on("Screen_Sharing", () => {
			console.log('on Screen Sharing')

			var constraints = {
				audio: true,
				video: {
					mandatory: {
						maxWidth: 320,
						maxFrameRate: 24,
						minFrameRate: 24
					}
				}
			};

			console.log('stream', this.stream, 'sharing', this.sharing)
			var participant = this.participants[this.userName];
			var video = participant.getVideoElement();
			console.log(video)
			if (this.sharing) {
				var options = {
					videoStream: this.stream,
					localVideo: video,
					mediaConstraints: constraints,
					onicecandidate: participant.onIceCandidate.bind(participant),
				}
			} else {
				var options = {
					videoStream: null,
					localVideo: video,
					mediaConstraints: constraints,
					onicecandidate: participant.onIceCandidate.bind(participant),
				}
			}
			participant.rtcPeer = WebRtcPeer.WebRtcPeerSendrecv(options,
				function (error) {
					if (error) {
						return console.error(error);
					}
					this.generateOffer(participant.offerToReceiveVideo.bind(participant));
				});

		});


		this.socket.on("updateremoteVideo", (user) => {
			var participant = this.participants[user.name];
			participant.dispose();
			delete this.participants[user.name];
			// this.eventBusService.emit(new EventData('updateParticipants', this.participants))
		});

		this.eventBusService.on('handleSharingClick', this.unsubscribe$, async () => {
			this.handleSharingClick()

		})

		this.eventBusService.on('handleMuteClick', this.unsubscribe$, async () => {
			console.log('eventBusService')
			this.handleMuteClick()

		})
		
		this.eventBusService.on('handleBitrateClick', this.unsubscribe$, (data) => {
			console.log('eventBusService')
			this.handleBitrateClick(data)

		})
	}


	onNewParticipant(request) {
		this.receiveVideo(request.name);

		this.eventBusService.emit(new EventData('newWhiteBoardOverlay', request.name));
	}

	/**
	 * 화면 표시용 Log 추가
	 * @param str 화면 log string
	 */
	private addLogStr(str: string) {
		// this.logString += `\n> ${str} `;
	}

	private addServerLogStr(str: string) {
		// this.logString += `\n<-- [server]: ${str} \n`;
	}


	//https://github.com/peterkhang/ionic-demo/blob/a5dc3bef1067eb93c2070b4d8feb233ac6d3427a/src/app/pages/videoCall/video-call.page.ts#L169
	onExistingParticipants(msg) {
		if (this.videoDeviceExist == true ){
			this.videoConstraints = {
				mandatory: {
					maxWidth: 320,
					maxFrameRate: 24,
					minFrameRate: 24
				}
			};
		} else {
			this.videoConstraints = false;
		}

		this.constraints = {
			audio: this.audioDeviceExist,
			video: this.videoConstraints
		};

		

		// console.log(this.constraints)
		var participant = new Participant(this.socketService, this.userName, this.userName, this.participantsElement);
		this.participants[this.userName] = participant;

		this.participantsService.updateParticipants(this.participants[this.userName]);
		var video = participant.getVideoElement();
		this.participantsService.updateMyVideo(video);
		
		this.eventBusService.on('selectVideoDevice', this.unsubscribe$ , async ( videoDeviceId )=>{
			console.log('첫 비디오 스트림---------------------')
			console.log(video.srcObject)
			this.videoConstraints = { 
				audio:{ 'echoCancellation': true },
				video:{
					deviceId: videoDeviceId,
				}
			};
			console.log(this.videoConstraints)
			console.log(this.constraints)
			await navigator.mediaDevices.getUserMedia(this.videoConstraints)
			.then(async(screenStream) => {
				// video = screenStream;
				this.localStream = screenStream;
				console.log('새 장치에 스트림 추출--------------------')
				console.log(this.localStream)
				console.log(video.srcObject)
				video.srcObject = this.localStream;
			}).catch(function (error) {
				if(error.name === 'PermissionDeniedError'){
					console.log('getUserMedia error: ' + error.name, error);
					location.reload();
					// callback('cancel');
				}
			});
		
		})
	
		// getUserDevice
		// constraints(제약)에 맞는 장치로 부터 데이터 스트림을 가져옴.
		// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
		navigator.mediaDevices.getUserMedia(this.constraints)
		.then(screenStream => {
			this.localStream = screenStream;
			video = screenStream;
			this.eventBusService.emit(new EventData("device_Check","")) 
		}).catch(function (error) {
			console.log('getUserMedia error: ' + error.name, error);
			// callback('cancel');
		});


		var options = {
			// videoStream: this.localStream,
			localVideo: video,
			mediaConstraints: this.constraints,
			onicecandidate: participant.onIceCandidate.bind(participant)
		}
		console.log(options)
		participant.rtcPeer = WebRtcPeer.WebRtcPeerSendonly(options,
			function (error) {
				if (error) {
					if (error.name == "NotAllowedError"){
						return console.log('장치에 입력이 들어오고 있지 않습니다. 다시 한번 확인해주세요.')
						// alert('장치에 입력이 들어오고 있지 않습니다. 다시 한번 확인해주세요.')
					}
					// return console.error(error);
					
					// console.log('장치에 입력이 들어오고 있지 않습니다. 다시 한번 확인해주세요.')
				}
				this.generateOffer(participant.offerToReceiveVideo.bind(participant));
			});


		/****************************************
		*   whiteBoard Mode 시 webRTC 오버레이
		*****************************************/
		this.eventBusService.on('whiteBoardClick', this.unsubscribe$, () => {

			// whiteBoard Mode일 경우
			if (this.whiteBoardMode == false) {
				this.whiteBoardMode = true;
				console.log('whiteBoard Mode On')

				// 내 local video와 name을 가져오기 위해 container 통째로
				var videoOverlay = document.getElementById(this.userName)
				videoOverlay.className = 'videoOverlay'
				var videoOverlay_container = document.getElementById('videoOverlay_container')
				videoOverlay_container.append(videoOverlay)

			} else {
				this.whiteBoardMode = false
				console.log('whiteBoard Mode Off')

				var video = document.getElementById(this.userName) // 내 local video
				video.classList.remove("videoOverlay");

				var videoOverlay = document.getElementById('participants')
				video.className = 'bigvideo'
				videoOverlay.append(video)
			}


		})


		/************************************************************************   
		*  msg.data =>  ['user1', 'user2' ...]
		*  늦게 room에 들어온 사람이 room에 이미 들어온 사람들의 데이터를 받는다.
		************************************************************************/
		// msg.data.forEach(this.receiveVideo);
		msg.data.forEach(existingUsers => {
			this.receiveVideo(existingUsers)

		});
		console.log(msg.data)
	}

	receiveVideo(sender) {
		var participant = new Participant(this.socketService, this.userName, sender, this.participantsElement);
		this.participants[sender] = participant;
		var video = participant.getVideoElement();

		this.eventBusService.emit(new EventData('updateParticipants', this.participants))

		var options = {
			remoteVideo: video,
			onicecandidate: participant.onIceCandidate.bind(participant)
		}

		participant.rtcPeer = WebRtcPeer.WebRtcPeerRecvonly(options,
			function (error) {
				if (error) {
					return console.error(error);
				}
				this.generateOffer(participant.offerToReceiveVideo.bind(participant));
			}
		);
		this.participantsElement.style.position = 'absolute'



		/*******************************************************
		*   whiteBoard Mode 시 webRTC 상대방 비디오 오버레이
		********************************************************/
		this.eventBusService.on('whiteBoardClick', this.unsubscribe$, () => {

			// whiteBoard Mode일 경우
			if (this.whiteBoardMode == true) {
				console.log('whiteBoard Mode On')

				var receiveVideoOverlay = document.getElementById(sender)
				receiveVideoOverlay.className = 'receiveVideoOverlay'
				var videoOverlay_container = document.getElementById('videoOverlay_container')
				videoOverlay_container.append(receiveVideoOverlay)

			} else {
				this.whiteBoardMode = false
				console.log('whiteBoard Mode Off')

				var video = document.getElementById(sender) // 상대방 video
				video.classList.remove("receiveVideoOverlay");

				var receiveVideoOverlay = document.getElementById('participants')

				receiveVideoOverlay.append(video)
			}


		})

		/****************************************
		*   whiteBoard Mode 시 새로 들어 온 webRTC 상대방 비디오 오버레이
		*****************************************/
		this.eventBusService.on('newWhiteBoardOverlay', this.unsubscribe$, (sender) => {

			if (this.whiteBoardMode == true) {
				// 내 local video와 name을 가져오기 위해 container 통째로
				var videoOverlay = document.getElementById(sender)
				videoOverlay.className = 'videoOverlay'
				var videoOverlay_container = document.getElementById('videoOverlay_container')
				videoOverlay_container.append(videoOverlay)
			}
		})


	}

	receiveVideoResponse(result) {
		this.participants[result.name].rtcPeer.processAnswer(result.sdpAnswer, function (error) {
			if (error) return console.error(error);
		});
		if (this.muted) {
			this.participants[result.name].rtcPeer.audioEnabled = false;
		}
		if (this.cameraOff) {
			this.participants[result.name].rtcPeer.videoEnabled = false;
		}

		var participant = this.participants[result.name];
		var isExist = participant.getContainer(result.name);


		if (isExist === "bigvideo") {
			document.getElementById(this.userName).className = "bigvideo";
		}

	}

	onParticipantLeft(request) {
		console.log('Participant ' + request.name + ' left');
		var participant = this.participants[request.name];

		// var isExist = document.getElementById(request.name).className;
		// var participantClass = new Participant(this.socketService, request.name, this.participantsElement)
		var isExist = participant.getContainer(request.name);

		if (this.whiteBoardMode == false) {
			if (isExist === "bigvideo") {
				document.getElementById(this.userName).className = "bigvideo";
			}
		}

		const filterd = participants_name.filter((data) => data !== request.name)
		participants_name = filterd;
		participant.dispose();
		delete this.participants[request.name];

		console.log('Participant ' + request.name + ' left');
	}

	handleLeaveRoomClick() {
		console.log('leaveRoom 실행')
		const leaveData = { roomname: this.roomName, username: this.userName }
		this.socket.emit("leaveRoom", leaveData);

		// 나중에 수정 리다이렉트
		// window.location.href = "/home.html";
	}

	getScreenStream(callback) {
		// if (navigator.getDisplayMedia) {
		// 	navigator.getDisplayMedia({
		// 		video: true
		// 	}).then(screenStream => {
		// 		callback(screenStream);
		// 	});
		// }
		if (navigator.mediaDevices.getDisplayMedia) {
			console.log('navigator.mediaDevices.getDisplayMedia')
			navigator.mediaDevices.getDisplayMedia({
				video: true
			}).then(screenStream => {
				callback(screenStream);
			}).catch(function (error) {
				console.log('getUserMedia error: ' + error.name, error);
				callback('cancel');
			}
			);
		} else {
			function getScreenId(error, sourceId, screen_constraints) {
				console.log('getScreeId fuction')
				// navigator.mediaDevices.getUserMedia(screen_constraints).then(function (screenStream) {
				// 	callback(screenStream);
				// });
			};

			getScreenId;
		}
	}
	//Sharing end//





	/*************************************
	*	eventHandler
	*************************************/
	// 카메라 On / Off
	handleCameraClick() {
		if (this.cameraOff) {
			console.log('Camera On')
			this.cameraBtn.innerText = "Camera Off";
			this.cameraOff = false;
			this.participants[this.userName].rtcPeer.videoEnabled = true;
		} else {
			console.log('Camera Off')
			this.cameraBtn.innerText = "Camera On";
			this.cameraOff = true;
			this.participants[this.userName].rtcPeer.videoEnabled = false;
		}
	}

	// 화면 공유
	handleSharingClick() {
		var video = this.call.querySelector('#video-' + this.userName);
		console.log('handleSharingClick-------video')
		console.log(video)

		if (this.sharing) {
			video.className = 'Sharing'
			// this.sharingBtn.innerText = "Screen Sharing";
			this.sharing = false;
			this.socket.emit("Screen_Sharing", '');
		} else {
			this.getScreenStream((screenStream) => {
				console.log('[ screenStream ]', screenStream)
				if (screenStream == 'cancel') {
					this.eventBusService.emit(new EventData('handleSharingCancel', ''))
				} else if (screenStream != null) {
					video.className = 'Sharing'
					this.stream = screenStream;
					video = screenStream;
					// this.sharingBtn.innerText = "Stop Sharing";
					this.sharing = true;
					this.socket.emit("Screen_Sharing", '');
				}

			});

		}
	}

	// 음소거
	handleMuteClick() {
		console.log('handleMuteClick')
		if (this.muted) {
			// this.muteBtn.innerText = "Mute";
			this.muted = false;
			this.participants[this.userName].rtcPeer.audioEnabled = true;
			console.log("음소거 해제")
		} else {
			// this.muteBtn.innerText = "Unmute";
			this.muted = true;
			this.participants[this.userName].rtcPeer.audioEnabled = false;
			console.log("음소거")
		}
	}
	
	// bitrate 변경
	handleBitrateClick(data){
		console.log('handleBitrateClick')
		console.log(data);
		this.socket.emit('changeBitrate', { 
			roomname : this.userData.roomName, 
			bitrate : data
		})
	}

}



var participants_name = [];

function checkClass(names) {
	names.forEach(name => {
		var isExist = document.getElementById(name).className;

		if (isExist === "bigvideo") {
			document.getElementById(name).classList.remove("bigvideo");
		}
	});

	console.log(names)
}



function Participant(socketService, userName, name, participants) {
	const socket = socketService.socket;
	participants_name.push(name);

	this.name = name;
	var container = document.createElement('div');

	container.id = name;

	var p = document.createElement('p');
	var video = document.createElement('video');

	container.appendChild(video);
	container.appendChild(p);

	if (userName === name) {
		container.className = "bigvideo";
	}

	participants.appendChild(container);
	document.getElementById('participants').appendChild(container);

	p.appendChild(document.createTextNode(name));

	container.onclick = function () {
		checkClass(participants_name);
		container.classList.toggle("bigvideo");
	}


	video.id = 'video-' + name;
	video.autoplay = true;
	video.controls = false;

	this.getElement = function () {
		return container;
	}

	this.getVideoElement = function () {
		return video;
	}

	this.getContainer = function (name) {
		var isExist = document.getElementById(name).className;
		// isExist = 'bigvideo'
		console.log(isExist)
		return isExist;
	}

	this.offerToReceiveVideo = function (error, offerSdp, wp) {
		if (error) return console.error("sdp offer error")
		console.log('Invoking SDP offer callback function');
		var msg = {
			id: "receiveVideoFrom",
			sender: name,
			sdpOffer: offerSdp
		};
		sendMessage(msg);
	}


	this.onIceCandidate = function (candidate, wp) {
		console.log("Local candidate" + candidate);

		var message = {
			id: 'onIceCandidate',
			candidate: candidate,
			sender: name
		};
		sendMessage(message);
	}

	Object.defineProperty(this, 'rtcPeer', { writable: true });

	this.dispose = function () {
		console.log('Disposing participant ' + this.name);
		this.rtcPeer.dispose();
		// container.parentNode.removeChild(container);
		container.parentNode.removeChild(container);
	};

	function sendMessage(message) {
		console.log('Senging message: ' + message.id);
		socket.emit(message.id, message);
	}
}

