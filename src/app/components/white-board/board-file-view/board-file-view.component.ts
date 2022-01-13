import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Subject } from 'rxjs';
import { pluck, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { EventData } from 'src/@wb/services/eventBus/event.class';


import { RenderingService } from 'src/@wb/services/rendering/rendering.service';
import { SocketService } from 'src/@wb/services/socket/socket.service';
import { ViewInfoService } from 'src/@wb/store/view-info.service';


/**
 * File View Component
 * - File Open 처리
 * - File List
 */
@Component({
    selector: 'app-board-file-view',
    templateUrl: './board-file-view.component.html',
    styleUrls: ['./board-file-view.component.scss']
})

export class BoardFileViewComponent implements OnInit {

    constructor(
        private route: ActivatedRoute,
        private renderingService: RenderingService,
        private viewInfoService: ViewInfoService,
        private eventBusService: EventBusService,
        private socketService: SocketService,
    ) {
        this.socket = this.socketService.socket;
    }


    // Open된 File을 white-board component로 전달
    @Output() newLocalDocumentFile = new EventEmitter();

    // image element
    @ViewChildren('thumb') thumRef: QueryList<ElementRef>

    private unsubscribe$ = new Subject<void>();

    private socket;
    meetingId: any;


    documentInfo = [];


    ngOnInit(): void {

        this.meetingId = this.route.snapshot.params['id'];

        // Document가 Update 된 경우 : File List rendering
        this.viewInfoService.state$
            .pipe(takeUntil(this.unsubscribe$), pluck('documentInfo'), distinctUntilChanged())
            .subscribe(async (documentInfo) => {
                this.documentInfo = documentInfo;
                await new Promise(res => setTimeout(res, 0));

                this.renderFileList(documentInfo);
            });


        /*-------------------------------------------
            doc 전환 하는 경우 sync
        ---------------------------------------------*/
        this.socket.on('sync:docChange', (docId) => {
            this.viewInfoService.changeToThumbnailView(docId);
        })

    }

    ngOnDestory(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }


    /**
     * PDF File 목록 표시
     * - file 변경시에 전체 다시 그림
     * - image 크기는 고정 size
     *
     * @param documentInfo
     * @returns
     */
    async renderFileList(documentInfo) {
        // File List Background 그리기 : 각 문서의 1page만 그림
        for (let i = 0; i < this.thumRef.toArray().length; i++) {
            await this.renderingService.renderThumbBackground(this.thumRef.toArray()[i].nativeElement, i + 1, 1);
        };

        // 아래와 같은 방식도 사용가능(참고용)
        // https://stackoverflow.com/questions/55737546/access-nth-child-of-viewchildren-querylist-angular
        // this.thumRef.forEach((element, index) => {
        //   this.renderingService.renderThumbBackground(element.nativeElement, index + 1, 1); // element, doc Number, page Number
        // });

    };


    /**
     * File List 에서 각 document 클릭
     *  - 해당 문서의 Thumbanil 표시화면으로 이동
     *  - viewInfo를 update
     * @param docId document ID
     */
    clickPdf(docId) {
        console.log('>> click PDF : change to Thumbnail Mode');
        this.viewInfoService.changeToThumbnailView(docId);

        /*-------------------------------------------
            doc 전환 하는 경우 sync
        ---------------------------------------------*/
        const data = {
            meetingId: this.meetingId,
            docId: docId
        }
        this.socket.emit('sync:doc', data)
    }


    /**
     * 새로운 File Load (Local)
     * - @output으로 main component(white-board.component로 전달)
     * @param event
     * @returns
     */
    handleUploadFileChanged(event) {
        const files: File[] = event.target.files;

        if (event.target.files.length === 0) {
            console.log('file 안들어옴');
            return;
        }

        // @OUTPUT -> white-board component로 전달
        this.newLocalDocumentFile.emit(event.target.files[0]);
    }

}
