import { Point } from '../../protocol/point';
import { Protocol } from '../../protocol/protocol';
import { StraightLine } from '../../compiled-objects/straight-line';
import { Box } from '../../compiled-objects/compiled-object';
import { PaintMode } from '../paint-mode';
import { PaintManager } from '../../paint-manager';
import { NetworkManager } from '../../network-manager';
import { SubMode } from '../sub-mode';
import { StraightLineModeMouse } from './straight-line-mode-mouse';
import { StraightLineModePen } from './straight-line-mode-pen';
import { StraightLineModeTouch } from './straight-line-mode-touch';

export class StraightLineMode extends PaintMode {
  readonly name = 'straight-line';

  constructor(predictCanvas: CanvasRenderingContext2D, paintManager: PaintManager, networkManager: NetworkManager) {
    super(predictCanvas, paintManager, networkManager);

    this.subModes = new Map<string, SubMode>([
      ['mouse', new StraightLineModeMouse(predictCanvas, paintManager, networkManager, this.reproduceObject)],
      ['pen', new StraightLineModePen(predictCanvas, paintManager, networkManager)],
      ['touch', new StraightLineModeTouch(predictCanvas, paintManager, networkManager, this.reproduceObject)],
    ]);
  }

  public reproduceObject(canvas: CanvasRenderingContext2D, object: StraightLine, color?: string, width?: number): void {
    canvas.beginPath();
    canvas.moveTo(object.begin.x, object.begin.y);
    canvas.lineTo(object.end.x, object.end.y);
    canvas.lineCap = 'round';
    canvas.lineWidth = width ?? object.width;
    canvas.strokeStyle = color ?? object.color;
    canvas.stroke();
  }

  public serializeObject(object: StraightLine, builder = new Protocol.Builder()): Protocol.Builder {
    builder.setProperty('i', object.id);
    builder.setProperty('c', object.color);
    builder.setProperty('w', object.width);
    builder.setProperty('x', object.box);
    builder.setProperty('b', object.begin);
    builder.setProperty('e', object.end);
    return builder;
  }

  public readObject(reader: Protocol.Reader): StraightLine | boolean {
    const straightLine = new StraightLine();

    reader.addMapping<string>('i', 'id', straightLine, Protocol.readString);
    reader.addMapping<string>('c', 'color', straightLine, Protocol.readString);
    reader.addMapping<number>('w', 'width', straightLine, Protocol.readNumber);
    reader.addMapping<Box>('x', 'box', straightLine, Protocol.readBox);
    reader.addMapping<Point>('b', 'begin', straightLine, Protocol.readPoint);
    reader.addMapping<Point>('e', 'end', straightLine, Protocol.readPoint);

    reader.read();

    return straightLine;
  }

  public exportObjectSVG(straightLine: StraightLine): string {
    return `M${straightLine.begin.x},${straightLine.begin.y} L${straightLine.end.x},${straightLine.end.y}`;
  }
}
