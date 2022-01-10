import { AfterViewInit, Component, ElementRef, OnChanges, OnInit, QueryList, ViewChild, ViewChildren, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Observable, Subject } from 'rxjs';
import { pluck, takeUntil, distinctUntilChanged, pairwise } from 'rxjs/operators';


import { CanvasService } from 'src/@wb/services/canvas/canvas.service';
import { DrawingService } from 'src/@wb/services/drawing/drawing.service';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { EventData } from 'src/@wb/services/eventBus/event.class';
import { RenderingService } from 'src/@wb/services/rendering/rendering.service';
import { SocketService } from 'src/@wb/services/socket/socket.service';

import { ViewInfoService } from 'src/@wb/store/view-info.service';



@Component({
	selector: 'app-board-slide-view',
	templateUrl: './board-slide-view.component.html',
	styleUrls: ['./board-slide-view.component.scss']
})

export class BoardSlideViewComponent implements OnInit {

	constructor(
		private route: ActivatedRoute,
		private canvasService: CanvasService,
		private renderingService: RenderingService,
		private viewInfoService: ViewInfoService,
		private eventBusService: EventBusService,
		private drawingService: DrawingService,
		private socketService: SocketService,

	) {
		this.socket = this.socketService.socket;
	}


	// Open된 File을 white-board component로 전달
	@Output() newLocalDocumentFile = new EventEmitter();

	private socket;
	private unsubscribe$ = new Subject<void>();

	meetingId: any;
	currentDocId: any;
	currentDocNum: any; // 선택한 pdf
	currentPageNum: number = 0;

	thumbWindow: HTMLDivElement;
	thumbWindowSize = {
		width: '',
		height: ''
	};

	thumbArray = []; // page별 thumbnail size
	scrollRatio: any;


	@ViewChildren('thumb') thumRef: QueryList<ElementRef> // 부모 thumb-item 안에 자식 element
	@ViewChildren('thumbCanvas') thumbCanvasRef: QueryList<ElementRef>
	@ViewChildren('thumbWindow') thumbWindowRef: QueryList<ElementRef>


	ngOnInit(): void {

		this.meetingId = this.route.snapshot.params['id'];

		// PageInfo 저장해서 사용
		this.viewInfoService.state$
			.pipe(takeUntil(this.unsubscribe$), distinctUntilChanged(), pairwise())
			.subscribe(([prevViewInfo, viewInfo]) => {

				// 현재 Current Page Info 저장
				this.currentDocId = viewInfo.pageInfo.currentDocId;
				this.currentDocNum = viewInfo.pageInfo.currentDocNum;
				this.currentPageNum = viewInfo.pageInfo.currentPage;

				// Thumbnail Mode로 전환된 경우 Thumbnail Rendering
				if (prevViewInfo.leftSideView != 'thumbnail' && viewInfo.leftSideView == 'thumbnail') {
					this.renderThumbnails();
				}
			});

		// container Scroll, Size, 판서event
		this.eventBusListeners();


		this.socket.on('sync:backToFileList', ()=> {
			this.viewInfoService.setViewInfo({ leftSideView: 'fileList' });
		})
	}


	ngOnDestory(): void {
		// unsubscribe all subscription
		this.unsubscribe$.next();
		this.unsubscribe$.complete();
	}


	/////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Event Bus 관련 Listeners
	 * Thumbnail Window 관련
	 * 판서 Event 관련
	 */
	eventBusListeners() {

		// 내가 그린 Event thumbnail에 그리기
		this.eventBusService.on('gen:newDrawEvent', this.unsubscribe$, async (data) => {
			this.drawThumb(data);
		});


		// 다른 사람이 그린 Event thumbnail에 그리기
		this.eventBusService.on('receive:drawEvent', this.unsubscribe$, async (data) => {
			// data = (data || '');
			// console.log(data)
			// console.log(data.drawingEvent);
			this.drawThumbRx(data);
		});


		/*--------------------------------------
			Scroll event에 따라서 thumbnail window 위치/크기 변경
			--> broadcast from comclass component
		--------------------------------------*/
		this.eventBusService.on('change:containerScroll', this.unsubscribe$, async (data) => {
			this.thumbWindow = this.thumbWindowRef.last.nativeElement;
			this.thumbWindow.style.left = data.left * this.scrollRatio + 'px';
			this.thumbWindow.style.top = data.top * this.scrollRatio + 'px';
		})

		/*-------------------------------------------
			zoom, page 전환등을 하는 경우
	
			1. scroll에 필요한 ratio 계산(thumbnail과 canvas의 크기비율)은 여기서 수행
			2. thumbnail의 window size 계산 수행
		---------------------------------------------*/
		this.eventBusService.on('change:containerSize', this.unsubscribe$, async (data) => {
			this.scrollRatio = this.thumbArray[this.currentPageNum - 1].width / data.coverWidth;
			this.thumbWindowSize = {
				width: this.thumbArray[this.currentPageNum - 1].width * data.ratio.w + 'px',
				height: this.thumbArray[this.currentPageNum - 1].height * data.ratio.h + 'px'
			};

			// console.log('<---[BUS] change:containerSize ::  this.thumbWindowSize : ', this.thumbWindowSize)
		});

	}

	/////////////////////////////////////////////////////////////////////////////////////////


	/**
	* Thumbnail Click
	*
	* @param pageNum 페이지 번호
	* @returns
	*/
	clickThumb(pageNum) {
		if (pageNum == this.currentPageNum) return; // 동일 page click은 무시

		console.log('>> [clickThumb] change Page to : ', pageNum);
		this.viewInfoService.updateCurrentPageNum(pageNum);
		// this.eventBusService.emit(new EventData('clickPdf', pageNum))

		/*-------------------------------------------
		zoom, page 전환등을 하는 경우 sync
		---------------------------------------------*/
		const data = {
			meetingId : this.meetingId,
			pageNum : pageNum
		}
		this.socket.emit('sync:page', data)
	}


	/**
	 * File list로 이동
	 */
	backToFileList() {
		this.viewInfoService.setViewInfo({ leftSideView: 'fileList' });

		const data = {
			meetingId : this.meetingId,
		}
		this.socket.emit('sync:FileList', (data))
	}


	/**
	 * 문서 Load에 따른 thumbnail 생성 및 Rendering
	 *
	 */
	async renderThumbnails() {

		const numPages = this.viewInfoService.state.documentInfo[this.currentDocNum - 1].numPages;

		this.thumbArray = [];

		for (let pageNum = 1; pageNum <= numPages; pageNum++) {
			/*-----------------------------------------------------------
			  1. get size of thumbnail canvas --> thumbnail element 생성.
			  - width, height, scale return.
			--------------------------------------------------------------*/
			const thumbSize = this.canvasService.getThumbnailSize(this.currentDocNum, pageNum);
			this.thumbArray.push(thumbSize);
		}

		await new Promise(res => setTimeout(res, 0));

		// Thumbnail Background (PDF)
		for (let i = 0; i < this.thumRef.toArray().length; i++) {
			await this.renderingService.renderThumbBackground(this.thumRef.toArray()[i].nativeElement, this.currentDocNum, i + 1);
		};

		// Thumbnail Board (판서)
		for (let i = 0; i < this.thumbCanvasRef.toArray().length; i++) {
			await this.renderingService.renderThumbBoard(this.thumbCanvasRef.toArray()[i].nativeElement, this.currentDocNum, i + 1);
		};

	}



	/**
	 * 판서 Thumbnail에 그리기 (현재 leftSideView: thumbnail)
	 *
	 * @param {Object} data 내가 판서한 draw event.
	 */
	drawThumb(data) {
		// 현재 leftSideView의 mode가 'fileList'인 경우 무사
		if (this.viewInfoService.state.leftSideView == 'fileList') return;

		// const thumbCanvas = document.getElementById('thumbCanvas' + this.currentPageNum)

		const thumbCanvas = this.thumbCanvasRef.toArray()[this.currentPageNum - 1].nativeElement;
		const thumbScale = this.thumbArray[this.currentPageNum - 1].scale;
		this.drawingService.drawThumb(data, thumbCanvas, thumbScale);
	};

	/**
	 * 수신 받은 판서 그리기
	 *
	 * @param data
	 */
	drawThumbRx(data) {
		// console.log(data);

		// 현재 viewmode가 filelist인 경우 Thumbnail 무시
		if (this.viewInfoService.state.leftSideView == 'fileList') return;

		// num 대신 ID로 (number로 해도 상관은 없을 듯)
		if (this.currentDocId == data.docId) {
			// const thumbCanvas = document.getElementById('thumbCanvas' + data.pageNum);

			const thumbCanvas = this.thumbCanvasRef.toArray()[data.pageNum - 1].nativeElement;
			const thumbScale = this.thumbArray[this.currentPageNum - 1].scale;
			this.drawingService.drawThumb(data.drawingEvent, thumbCanvas, thumbScale);
		}
	};

}
