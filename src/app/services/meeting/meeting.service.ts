import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class MeetingService {



	private meetingDataSubject$ = new BehaviorSubject({});
	meetingDAta$ = this.meetingDataSubject$.asObservable();

	private URL = '/apim/v1/';
	constructor(
		private http: HttpClient
	) { }


	getMeetingData(data: any) {
		console.log(data)
		console.log(data.meetingId)
		return this.http.get('/apim/v1/meetingInfo/' + data.meetingId);
	}

	getUserData(userId: any) {
		console.log(userId)
		console.log(userId)
		return this.http.get('/apim/v1/collab/getUserData/' + userId);
	}


	// 채팅 생성
	createChat(data) {
		console.log('[API] -----> createChat');
		return this.http.post('/apim/v1/collab/createChat/', data);
	}

	// 채팅 불러오기
	getMeetingChat(meetingId) {
		console.log('[API] -----> getMeetingChat');
		return this.http.get('/apim/v1/collab/getChat/', {params: meetingId});
	}

	// 채팅 삭제
	deleteMeetingChat(chatId) {
		console.log('[API] -----> deleteMeetingChat');
		return this.http.delete('/apim/v1/collab/deleteChat/', {params: chatId});
	}

	// 미팅 삭제 시 DB에 저장된 채팅 삭제
	deleteAllOfChat(data) {
		console.log('[API] -----> deleteAllOfChat');
		return this.http.delete('/apim/v1/collab/deleteAllOfChat/');
	}

}
