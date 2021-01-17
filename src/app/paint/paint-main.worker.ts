/// <reference lib="webworker" />
import { Paint } from './paint';
import { WorkerMessagesEnum } from './workerMessages.enum';

const paint = new Paint();

addEventListener('message', ({ data }) => {

  switch (data.type as WorkerMessagesEnum) {
    case WorkerMessagesEnum.CanvasSetup:
      paint.Init(data.mainCanvas, data.predictCanvas, data.devicePixelRatio);
      break;

    case WorkerMessagesEnum.PointerDown:
      paint.OnPointerDown(data.point);
      break;

    case WorkerMessagesEnum.PointerMove:
      paint.OnPointerMove(data.point);
      break;

    case WorkerMessagesEnum.PointerUp:
      paint.OnPointerUp(data.point);
      break;

    case WorkerMessagesEnum.AnimationFrame:
      paint.OnAnimationFrame();
      break;

    case WorkerMessagesEnum.Settings:
      paint.OnSettingsUpdate(data.newSettings);
      break;

    case WorkerMessagesEnum.Mode:
      paint.OnModeChange(data.mode);
      break;

    case WorkerMessagesEnum.Clear:
      paint.OnClear();
      break;
  }

  //console.log(data);

  // postMessage(response);
});
