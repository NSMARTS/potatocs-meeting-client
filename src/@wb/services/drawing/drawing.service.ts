import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DrawingService {

  private sourceCanvas:any;
  constructor() { }
  /**
     * Drawing Start
     */
  start(context, points, tool, sourceCanvas) {
    switch (tool.type) {
      case 'pen':
        context.globalCompositeOperation = 'source-over';
        context.lineCap = "round";
        context.lineJoin = 'round';
        context.fillStyle = tool.color;
        context.strokeStyle = tool.color;
        context.lineWidth = 1; // check line width 영향...
        context.beginPath();
        context.arc(points[0], points[1], tool.width / 2, 0, Math.PI * 2, !0);
        context.fill();
        console.log('Start')
        context.closePath();
        break;
      case 'eraser':
          // eraser Marker 표시
          this.eraserMarker(context, [points[0], points[1]], tool.width);
        break;
      // 포인터
      case 'pointer':
        context.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
        context.globalCompositeOperation = 'source-over';
        context.lineCap = "round";
        context.lineJoin = 'round';
        context.fillStyle = 'red';
        context.strokeStyle = 'black';
        context.lineWidth = 1; // check line width 영향...
        context.beginPath();
        context.arc(points[0], points[1], 30 / 2, 0, Math.PI * 2, !0);
        context.fill();
        context.stroke();

        context.closePath();
        break;
    
      default:
        break;
    }
  }


  /**
   * Drawing Move
   */
  move(context, points, tool, zoomScale, sourceCanvas) {
    context.globalCompositeOperation = 'source-over';
    this.sourceCanvas = sourceCanvas
    context.lineCap = "round";
    context.lineJoin = 'round';
    context.lineWidth = tool.width;
    context.fillStyle = tool.color;
    context.strokeStyle = tool.color;

    let a;
    let b;
    let c;
    let d;
    let i;
    const len = points.length / 2; // x, y 1차원 배열로 처리 --> /2 필요.

    context.beginPath();
    console.log('move')
    switch (tool.type) {
      case 'pen': // Drawing은 새로운 부분만 그림 : 전체를 다시 그리면 예전 PC에서 약간 티가남...
        if (len < 3) {
          // context.moveTo(points[len-2].x, points[len-2].y);
          // context.lineTo(points[len-1].x, points[len-1].y);
          context.moveTo(points[2 * (len - 2)], points[2 * (len - 2) + 1]);
          context.lineTo(points[2 * (len - 1)], points[2 * (len - 1) + 1]);
          context.stroke();
          context.closePath();
          break;
        }

        // a = (points[len - 3].x + points[len - 2].x) / 2;
        // b = (points[len - 3].y + points[len - 2].y) / 2;
        // c = (points[len - 2].x + points[len - 1].x) / 2;
        // d = (points[len - 2].y + points[len - 1].y) / 2;
        a = (points[2 * (len - 3)] + points[2 * (len - 2)]) / 2;
        b = (points[2 * (len - 3) + 1] + points[2 * (len - 2) + 1]) / 2;
        c = (points[2 * (len - 2)] + points[2 * (len - 1)]) / 2;
        d = (points[2 * (len - 2) + 1] + points[2 * (len - 1) + 1]) / 2;

        context.moveTo(a, b);
        // context.quadraticCurveTo(points[len - 2].x, points[len - 2].y, c, d);
        context.quadraticCurveTo(points[2 * (len - 2)], points[2 * (len - 2) + 1], c, d);
        context.stroke();
        context.closePath();
        break;

      case 'eraser':	// 지우개는 cover canvas 초기화 후 처음부터 다시 그림 : eraser marker 표시용도...
        context.clearRect(0, 0, context.canvas.width / zoomScale, context.canvas.height / zoomScale);
        if (len < 3) {
          context.beginPath();
          // context.arc(points[0].x, points[0].y, tool.width/ 2, 0, Math.PI * 2, !0);
          context.arc(points[0], points[1], tool.width / 2, 0, Math.PI * 2, !0);
          context.fill();
          context.closePath();
          // eraser Marker
          // eraserMarker(context,points[len-1],tool.width);
          this.eraserMarker(context, [points[2 * (len - 1)], points[2 * (len - 1) + 1]], tool.width);
          break;
        }

        context.moveTo(points[0], points[1]);
        for (i = 1; i < len - 2; i++) {
          c = (points[2 * i] + points[2 * (i + 1)]) / 2;
          d = (points[2 * i + 1] + points[2 * (i + 1) + 1]) / 2;
          context.quadraticCurveTo(points[2 * i], points[2 * i + 1], c, d);
        }

        context.quadraticCurveTo(points[2 * i], points[2 * i + 1], points[2 * (i + 1)], points[2 * (i + 1) + 1]);
        context.stroke();
        context.closePath();

        // eraser Marker
        this.eraserMarker(context, [points[2 * (len - 1)], points[2 * (len - 1) + 1]], tool.width);
        break;

      case 'pointer':
          context.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
          context.globalCompositeOperation = 'source-over';
          context.lineCap = "round";
          context.lineJoin = 'round';
          context.fillStyle = 'red';
          context.strokeStyle = 'black';
          context.lineWidth = 1; // check line width 영향...
          context.beginPath();
          context.arc(points[2 * (len - 1)], points[2 * (len - 1) + 1], 30 / 2, 0, Math.PI * 2, !0);
          context.fill();
          context.stroke();
          context.closePath();
          
          break;

      default:
        break;
    }
  }

  end(context, points, tool) {
    context.lineCap = "round";
    context.lineJoin = 'round';
    context.lineWidth = tool.width;
    context.strokeStyle = tool.color;
    context.fillStyle = tool.color;

    // cover canvas 초기화 후 다시 그림.
    // context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    let i;
    let c;
    let d;
    const len = points.length / 2;

    if (tool.type === "pointer"){
      // context.clearRect(0, 0, this.sourceCanvas.width, this.sourceCanvas.height);
      return
    } else if (tool.type === "pen") {
      context.globalCompositeOperation = 'source-over';
    }
    else {
      context.globalCompositeOperation = 'destination-out';
    }

    // context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    if (len < 3) {
      context.beginPath();
      context.arc(points[0], points[1], tool.width / 2, 0, Math.PI * 2, !0);
      context.fill();
      context.closePath();
      return;
    }

    context.beginPath();
    context.moveTo(points[0], points[1]);
    // console.log('end')
    for (i = 1; i < len - 2; i++) {
      // var c = (points[i].x + points[i + 1].x) / 2,
      // 	d = (points[i].y + points[i + 1].y) / 2;
      //	context.quadraticCurveTo(points[i].x, points[i].y, c, d);
      c = (points[2 * i] + points[2 * (i + 1)]) / 2;
      d = (points[2 * i + 1] + points[2 * (i + 1) + 1]) / 2;
      context.quadraticCurveTo(points[2 * i], points[2 * i + 1], c, d);
    }
    // context.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    context.quadraticCurveTo(points[2 * i], points[2 * i + 1], points[2 * (i + 1)], points[2 * (i + 1) + 1]);
    context.stroke();
    context.closePath();

  }

  /**
       * 지우개 marker 표시
       */
  eraserMarker(ctx, point, width) {
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'white';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(point[0], point[1], width / 2, 0, Math.PI * 2, !0);
    ctx.stroke();
    ctx.closePath();
  }

  // Thumbnail에 그리기
  drawThumb(data, thumbCanvas, thumbScale) {
    const thumbCtx = thumbCanvas.getContext('2d');
    // prepare scale
    thumbCtx.save();
    thumbCtx.scale(thumbScale, thumbScale);
    this.end(thumbCtx, data.points, data.tool);
    thumbCtx.restore();
  }

  dataArray: any = [];
  stop: any = null;

  /**
 * page 전환 등...--> 기존에 그려지고 있던 event stop.
 */
  stopRxDrawing() {
    if (this.stop) {
      clearInterval(this.stop);
      this.stop = null;
    }
    this.dataArray = [];
  }

/**
   * page 전환 등...--> 기존에 그려지고 있던 event stop.
   *
   */
   async rxPointer(data, sourceCanvas, targetCanvas, scale, docNum, pageNum) {
      console.log(data)
      console.log('rxPointer-------------------------')
      const context = sourceCanvas.getContext("2d"); 
      context.globalCompositeOperation = 'source-over';
      context.lineCap = "round";
      context.lineJoin = 'round';
      context.fillStyle = 'red';
      context.strokeStyle = 'black';
      context.lineWidth = 1; // check line width 영향...
      context.beginPath();
      context.clearRect(0, 0, sourceCanvas.width / scale, sourceCanvas.height / scale);
      context.arc(data.points[0], data.points[1], 30 / 2, 0, Math.PI * 2, !0);
      context.fill();
      context.stroke();
      context.closePath();
      return;
  
  }


  /**
   * page 전환 등...--> 기존에 그려지고 있던 event stop.
   *
   */
  async rxDrawing(data, sourceCanvas, targetCanvas, scale, docNum, pageNum) {
    console.log('rxDrawing---------------------------------------------')
    const tmpData = {
      data,
      sourceCanvas,
      targetCanvas,
      scale,
      docNum,
      pageNum
    };

    this.dataArray.push(tmpData);
    // 하나의 event인 경우 그리기 시작.
    if (this.dataArray.length === 1) {
      this.rxDrawingFunc();
    }
  }


  async rxDrawingFunc() {
    console.log('rxDrawingFunc~~~~~~~~~~')
    if (this.dataArray.length === 0) return;

    const data = await this.dataArray[0].data;
    const pointsLength = data.points.length / 2;

    const sourceCanvas = this.dataArray[0].sourceCanvas;
    const context = sourceCanvas.getContext("2d");

    const targetCanvas = this.dataArray[0].targetCanvas;
    const targetContext = targetCanvas.getContext("2d");

    const scale = this.dataArray[0].scale;

    context.lineCap = "round";
    context.lineJoin = 'round';
    context.lineWidth = data.tool.width;

    if (data.tool.type === "pen") {
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = data.tool.color;
      context.fillStyle = data.tool.color;
    }
    else if (data.tool.type === "eraser"){
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = "rgba(255, 255, 255, 1)";
      context.fillStyle = "rgba(255, 255, 255, 1)";
    } 

    if (pointsLength < 3) {
      context.beginPath();
      context.arc(data.points[0], data.points[1], data.tool.width / 2, 0, Math.PI * 2, !0);
      context.fill();
      context.closePath();

      this.dataArray.shift();
      this.rxDrawingFunc();
      return;
    }

    let i = 2;

    this.stop = setInterval(() => {
      context.beginPath();
      if (i === 2) {
        context.moveTo(data.points[0], data.points[1]);
      }
      else {
        const a = (data.points[2 * (i - 2)] + data.points[2 * (i - 1)]) / 2;
        const b = (data.points[2 * (i - 2) + 1] + data.points[2 * (i - 1) + 1]) / 2;
        context.moveTo(a, b);
      }
      const c = (data.points[2 * (i - 1)] + data.points[2 * i]) / 2;
      const d = (data.points[2 * (i - 1) + 1] + data.points[2 * i + 1]) / 2;

      context.quadraticCurveTo(data.points[2 * (i - 1)], data.points[2 * (i - 1) + 1], c, d);
      context.stroke();
      i += 1;

      if (i === pointsLength) {
        clearInterval(this.stop);
        this.stop = null;

        this.dataArray.shift();
        context.clearRect(0, 0, sourceCanvas.width / scale, sourceCanvas.height / scale);

        // 최종 target에 그리기
        this.end(targetContext, data.points, data.tool);

        // 다음 event 그리기 시작.
        this.rxDrawingFunc();
      }

    }, data.timeDiff / pointsLength);

  }

  /**
   * 수신 DATA 썸네일에 그리기
   *
   * @param data
   * @param thumbCanvas
   * @param thumbScale
   */
  rxDrawingThumb(data, thumbCanvas, thumbScale) {
    const thumbCtx = thumbCanvas.getContext('2d');
    // prepare scale
    thumbCtx.save();
    thumbCtx.scale(thumbScale, thumbScale);
    this.end(thumbCtx, data.points, data.tool);
    thumbCtx.restore();
  }
}
