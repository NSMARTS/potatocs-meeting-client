import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { Subject } from 'rxjs';
import { pluck, takeUntil, distinctUntilChanged } from 'rxjs/operators'

import { CANVAS_CONFIG, DRAWING_TYPE } from '../../../../@wb/config/config';

import { EditInfoService } from 'src/@wb/store/edit-info.service';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { DrawStorageService } from 'src/@wb/storage/draw-storage.service';
import { ViewInfoService } from 'src/@wb/store/view-info.service';
import { EventData } from 'src/@wb/services/eventBus/event.class';
import { ApiService } from 'src/@wb/services/apiService/api.service';
import { SocketService } from 'src/@wb/services/socket/socket.service';

// icon icon 별로 불러오기
import eraserIcon from '@iconify/icons-mdi/eraser';
import shapeOutlineIcon from '@iconify/icons-mdi/shape-outline';



@Component({
    selector: 'app-board-nav',
    templateUrl: './board-nav.component.html',
    styleUrls: ['./board-nav.component.scss']
})
export class BoardNavComponent implements OnInit {
    isSyncMode: boolean;
    colorList = [
        { color: 'black' },
        { color: 'white' },
        { color: 'red' },
        { color: 'blue' },
        { color: 'green' },
        { color: 'yellow' }
    ]
    currentColor = 'black';
    currentTool: string = 'pen';
    menuName: any;
    currentDocNum: any;
    currentPage: any;
    currentDocId: string;
    private socket;


     // iconify TEST //////////////////////
    eraserIcon = eraserIcon;
    shapeOutlineIcon = shapeOutlineIcon;
  //////////////////////////////////////

    // Width: 3단계 설정
    widthSet = CANVAS_CONFIG.widthSet;
    currentWidth = {
        pointer: this.widthSet.pointer[0],
        pen: this.widthSet.pen[0],
        eraser: this.widthSet.eraser[2],
        line: this.widthSet.line[0],
        circle: this.widthSet.circle[0],
        rectangle: this.widthSet.rectangle[0],
        roundedRectangle: this.widthSet.roundedRectangle[0],
    };
    mode: any = 'move';
    myRole: any; // 나의 역할(권한)

    private unsubscribe$ = new Subject<void>();

    constructor(
        private editInfoService: EditInfoService,
        private eventBusService: EventBusService,
        private drawStorageService: DrawStorageService,
        private viewInfoService: ViewInfoService,
        private apiService: ApiService,
        private socketService: SocketService,
    ) {
        this.socket = this.socketService.socket;
    }


    ngOnInit(): void {
        // 현재 Page 변경
        this.viewInfoService.state$
            .pipe(takeUntil(this.unsubscribe$), pluck('pageInfo'), distinctUntilChanged())
            .subscribe((pageInfo) => {
                this.currentDocNum = pageInfo.currentDocNum;
                this.currentPage = pageInfo.currentPage;
                this.currentDocId = pageInfo.currentDocId;

            });

        this.editInfoService.state$
            .pipe(takeUntil(this.unsubscribe$), distinctUntilChanged())
            .subscribe((editInfo) => {
                // console.log(editInfo);
                this.mode = editInfo.mode;
                this.currentTool = editInfo.tool;
                this.currentColor = editInfo.toolsConfig.pen.color;
                this.currentWidth = {
                    pointer: editInfo.toolsConfig.pointer.width,
                    pen: editInfo.toolsConfig.pen.width,
                    eraser: editInfo.toolsConfig.eraser.width,
                    line: editInfo.toolsConfig.line.width,
                    circle: editInfo.toolsConfig.circle.width,
                    rectangle: editInfo.toolsConfig.rectangle.width,
                    roundedRectangle: editInfo.toolsConfig.roundedRectangle.width,
                }
            });

        /*-------------------------------------------
                role에 따라 권한 설정
            ---------------------------------------------*/
        this.eventBusService.on('myRole', this.unsubscribe$, (myRole) => {
            this.myRole = myRole.role

            if (this.myRole == 'Participant') {
                this.changeMode('move')
            }

        })
    }


    /**
     * 색상 변경
     *
     * - 현재 pen인 경우에만 반응
     * @param color 색상 : 향후 HEXA로 변경 고려
     *
     */
    changeColor(color) {
        const editInfo = Object.assign({}, this.editInfoService.state);
        editInfo.mode = 'draw';
        if (editInfo.mode != 'draw' || (editInfo.tool == 'erasar' || editInfo.tool == 'pointer')) return;
        editInfo.toolsConfig.pen.color = color;
        editInfo.toolsConfig.line.color = color;
        editInfo.toolsConfig.circle.color = color;
        editInfo.toolsConfig.rectangle.color = color;
        editInfo.toolsConfig.roundedRectangle.color = color;
        this.editInfoService.setEditInfo(editInfo);
    }

    /**
     * Width 변경
     *
     * -현재 Pen 또는 eraser인 경우에만 반응
     *
     * @param width
     */
    changeWidth(width) {

        const editInfo = Object.assign({}, this.editInfoService.state);

        if (editInfo.mode != 'draw') return;

        const tool = editInfo.tool; // tool: 'pen', 'eraser'
        editInfo.toolsConfig[tool].width = width;

        this.editInfoService.setEditInfo(editInfo);
    }


    /**
     * Pen, Eraser 선택
     *
     * @param tool : 'pen', 'eraser'
     *
     */
    async changeTool(tool) {
        // console.log(tool)
        const editInfo = Object.assign({}, this.editInfoService.state);
        editInfo.mode = 'draw';

        if (editInfo.tool == 'eraser' && tool == 'eraser') {
            if(confirm("Do you want to delete all drawings on the current page?")){
                const data = {
                    docId: this.currentDocId,
                    currentDocNum: this.currentDocNum,
                    currentPage: this.currentPage
                }

                // 다른 사람들에게 드로우 이벤트 제거
                this.socket.emit('clearDrawingEvents', data)

                // 자기자신한테 있는 드로우 이벤트 제거
                this.drawStorageService.clearDrawingEvents(this.currentDocNum, this.currentPage);
                this.eventBusService.emit(new EventData('rmoveDrawEventPageRendering', ''));
                this.eventBusService.emit(new EventData('rmoveDrawEventThumRendering', ''));
            } else {
                return;
            }
        }

        editInfo.tool = tool;
        this.editInfoService.setEditInfo(editInfo);

        // 지우개 2번 Click은 여기서 check 하는 것이 좋을 듯?

    }

    /**
     * Move 선택
     *
     * @param mode : 현재는 'move'만 있음 (향후 sync?)
     *
     */
    changeMode(mode) {
        const editInfo = Object.assign({}, this.editInfoService.state);
        editInfo.mode = 'move';
        this.editInfoService.setEditInfo(editInfo);
    }

}
