import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators'

import { CANVAS_CONFIG, DRAWING_TYPE } from '../../../../@wb/config/config';

import { EditInfoService } from 'src/@wb/store/edit-info.service';



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


  // Width: 3단계 설정
  widthSet = CANVAS_CONFIG.widthSet;
  currentWidth = {
    pen: this.widthSet.pen[0],
    eraser: this.widthSet.eraser[2]
  };
  mode: any = 'move';

  private unsubscribe$ = new Subject<void>();

  constructor(
    private editInfoService: EditInfoService
  ) { }


  ngOnInit(): void {

    this.editInfoService.state$
      .pipe(takeUntil(this.unsubscribe$), distinctUntilChanged())
      .subscribe((editInfo) => {
        // console.log(editInfo);
        this.mode = editInfo.mode;
        this.currentTool = editInfo.tool;
        this.currentColor = editInfo.toolsConfig.pen.color;
        this.currentWidth = {
          pen: editInfo.toolsConfig.pen.width,
          eraser: editInfo.toolsConfig.eraser.width
        }
      });
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

    if (editInfo.mode != 'draw' || editInfo.tool!='pen' ) return;

    editInfo.toolsConfig.pen.color = color;
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
  changeTool(tool) {
    // console.log(tool)
    const editInfo = Object.assign({}, this.editInfoService.state);
    editInfo.mode = 'draw';
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
