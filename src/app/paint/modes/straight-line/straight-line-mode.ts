import { Point } from '../../protocol/point';
import { Protocol } from '../../protocol/protocol';
import { StraightLine } from '../../compiled-objects/straight-line';
import { PaintMode } from '../paint-mode';
import { SubMode } from '../sub-mode';
import { StraightLineModeMouse } from './straight-line-mode-mouse';
import { StraightLineModePen } from './straight-line-mode-pen';
import { StraightLineModeTouch } from './straight-line-mode-touch';
import { LineCapStyle, PDFPage, rgb } from 'pdf-lib';
import { Box } from '../../compiled-objects/box';
import { PaintManager } from '../../managers/paint-manager';
import { NetworkManager } from '../../managers/network-manager';

export class StraightLineMode extends PaintMode {

  constructor(predictCanvas: CanvasRenderingContext2D, paintManager: PaintManager, networkManager: NetworkManager) {
    super('straight-line', predictCanvas, paintManager, networkManager);

    this.subModes = new Map<string, SubMode>([
      ['mouse', new StraightLineModeMouse(this, this.reproduceObject)],
      ['pen', new StraightLineModePen(this)],
      ['touch', new StraightLineModeTouch(this, this.reproduceObject)],
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
    const straightLine = new StraightLine(this);

    reader.addMapping<string>('i', 'id', straightLine, Protocol.readString);
    reader.addMapping<string>('c', 'color', straightLine, Protocol.readString);
    reader.addMapping<number>('w', 'width', straightLine, Protocol.readNumber);
    reader.addMapping<Box>('x', 'box', straightLine, Protocol.readBox);
    reader.addMapping<Point>('b', 'begin', straightLine, Protocol.readPoint);
    reader.addMapping<Point>('e', 'end', straightLine, Protocol.readPoint);

    reader.read();

    return straightLine;
  }

  public drawObjectOnPDFPage(straightLine: StraightLine, page: PDFPage): void {
    const path = `M${straightLine.begin.x},${straightLine.begin.y} L${straightLine.end.x},${straightLine.end.y}`;
    const bigint = parseInt(straightLine.color.substr(1), 16);
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;
    page.drawSvgPath(path, {
      borderColor: rgb(r, g, b),
      borderWidth: straightLine.width,
      borderLineCap: LineCapStyle.Round,
    });
  }
}
