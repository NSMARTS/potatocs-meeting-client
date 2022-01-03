import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MeetingService {

  private meetingDataSubject$ = new BehaviorSubject({});
  meetingDAta$ = this.meetingDataSubject$.asObservable();

  constructor(
    private http: HttpClient,
  ) { }


  getMeetingData(data: any) {
    console.log(data)
    console.log(data.meetingId)
    return this.http.get('/apim/v1/meetingInfo/'+ data.meetingId);
  }

  getUserData(userId: any) {
    console.log(userId)
    console.log(userId)
    return this.http.get('/apim/v1/collab/getUserData/'+ userId);
  }

}
