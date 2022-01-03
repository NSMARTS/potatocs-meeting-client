/** resize할 image의 크기 -> 1200 px로 설정 */
export const IMAGE_SIZE = 1200;


/***************  [ DRAWING/RECORDING 관련 설정 ]  **************** */
export const CANVAS_CONFIG = {
	thumbnailMaxSize: 150,
	maxContainerHeight: 0,
	maxContainerWidth: 0,
	CSS_UNIT: 96 / 72, // 100% PDF 크기 => 실제 scale은 1.333....
	deviceScale: 1,
	maxZoomScale: 3,
	minZoomScale: 0.1,
	penWidth: 2,
	eraserWidth: 30,
	sidebarWidth: 171,
	// navbarHeight: 70,
	navbarHeight: 134,
	widthSet: {
		pen: [4, 7, 13],
		eraser: [30, 45, 60]
	},
	sidebarContainerWidth: 100
};

export const CANVAS_EVENT = {
	GEN_DRAW: 'gen:newDrawEvent',
	RESIZE_CONTAINER: 'resize:container',
	FINISH_REPLAY: 'finish:replay'
};

export const DRAWING_TYPE = {
	PEN: 'pen',
	ERASER: 'eraser'
};



/*------------------------
	package version :
	- 문서 저장시 사용.
------------------------*/
export const PDF_VERSION = {
	pdfVersion: '0.0.1',
	version: 'white-board-cloud',
}
