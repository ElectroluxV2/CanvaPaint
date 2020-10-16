import { PacketType, FreeStart, FreeEnd, FreeDraw, Packet, FreeDot, Resize, StraightPredict, StraightDraw, Mode, Color, Undo, FreeLine, StraightLine, Dot, Redo, Char, CharDraw } from './protocol';
import * as io from 'socket.io-client';
import { Socket } from 'socket.io';
import { EventEmitter } from '@angular/core';

interface PaintData {
    startX: number;
    startY: number;
    cursorX: number;
    cursorY: number;
    straightPredict: {
        start: {
            x: number;
            y: number;
        },
        end: {
            x: number;
            y: number;
        },
        color: Color;
    };
    chars: Char[];
    startStraightX: number;
    startStraightY: number;
    lastPointX: number;
    lastPointY: number;
    freeLines: FreeLine[];
    currentFreeLine: FreeLine;
    straightLines: StraightLine[];
    dots: Dot[];
}

export class Paint {
    // Internal
    private leftDown = false;
    private rightDown = false;
    private dragging = false;
    private canDraw = false;

    private currentColor: Color = Color.BLACK;
    private mode: Mode = Mode.FREE;

    private ctx: CanvasRenderingContext2D;
    private ctx2: CanvasRenderingContext2D;

    private ctx3: CanvasRenderingContext2D;
    private lastBorderX = -1;
    private lastBorderY = -1;

    private local: PaintData[] = [];
    private remote: PaintData[] = [];

    private history: Mode[] = [];
    private restory: (StraightLine | FreeLine | Dot | Char)[] = [];

    private socket: Socket;
    // Emits connection status
    public statusEmitter: EventEmitter<string> = new EventEmitter<string>();

    constructor(private canvas: HTMLCanvasElement, private predictCanvas: HTMLCanvasElement, private backgroundCanvas: HTMLCanvasElement) {

        // Internal
        predictCanvas.height = predictCanvas.parentElement.offsetHeight;
        predictCanvas.width = predictCanvas.parentElement.offsetWidth;
        this.ctx2 = predictCanvas.getContext('2d');

        canvas.height = canvas.parentElement.offsetHeight;
        canvas.width = canvas.parentElement.offsetWidth;
        this.ctx = canvas.getContext('2d');

        backgroundCanvas.height = backgroundCanvas.parentElement.offsetHeight;
        backgroundCanvas.width = backgroundCanvas.parentElement.offsetWidth;
        this.ctx3 = backgroundCanvas.getContext('2d');

        // Defaults
        this.ctx.lineWidth = this.ctx2.lineWidth = 5;
        this.ctx3.lineWidth = 2;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = this.ctx2.strokeStyle = this.currentColor;

        // Setup Paint data for local and remote
        this.local = [{
            startX: -1,
            startY: -1,
            cursorX: -1,
            cursorY: -1,
            straightPredict: {
                start: {
                    x: -1,
                    y: -1
                },
                end: {
                    x: -1,
                    y: -1
                },
                color: Color.BLACK,
            },
            chars: [],
            startStraightX: -1,
            startStraightY: -1,
            lastPointX: -1,
            lastPointY: -1,
            freeLines: [],
            currentFreeLine: { type: Mode.FREE, start: { x: 0, y: 0 }, parts: [] } as FreeLine,
            straightLines: [],
            dots: [],
        }];

        // Setup Paint data for remote
        this.remote = [];

        // Setup Socket
        this.socket = io('http://ipmateusza.ga:3000');
        console.log('Connecting to http://ipmateusza.ga:3000');

        // Control connection
        this.socket.on('connect_error', (err: any) => {
            this.statusEmitter.emit('connect_error');
        });

        this.socket.on('reconnect_failed', () => {
            this.statusEmitter.emit('reconnect_failed');
        });

        this.socket.on('reconnect_error', (err: any) => {
            this.statusEmitter.emit('reconnect_error');
        });

        this.socket.on('disconnect', () => {
            this.statusEmitter.emit('disconnect');
        });

        this.socket.on('error', (err: any) => {
            this.statusEmitter.emit('error');
        });

        this.socket.on('pong', (latency: any) => {
            console.log('Latency: ' + latency + ' ms');
        });

        // Notify server
        this.socket.on('connect', () => {
            this.statusEmitter.emit('connected');
            // @ts-ignore
            this.socket.emit(PacketType.RESIZE, {
                x: this.canvas.width,
                y: this.canvas.height
            });
        });

        // Listen to data from other clients
        // @ts-ignore
        this.socket.on(PacketType.FREE_START, (packet: FreeStart) => {
            const id = packet.socketId;
            this.checkRemote(id);

            this.remote[id].startX = packet.x;
            this.remote[id].startY = packet.y;
            this.remote[id].currentFreeLine.start.x = this.remote[id].startX;
            this.remote[id].currentFreeLine.start.y = this.remote[id].startY;
        });

        // @ts-ignore
        this.socket.on(PacketType.CHAR_DRAW, (packet: CharDraw) => {
            const id = packet.socketId;
            this.checkRemote(id);

            const c: Char = {
                type: Mode.CHAR,
                x: packet.x,
                y: packet.y,
                color: packet.color,
                char: packet.char
            };

            this.remote[id].chars.push(c);

            this.ctx.font = '50px Comic Sans MS';
            this.ctx.fillStyle = packet.color;
            const x = this.ctx.measureText(packet.char).width;
            const y = this.ctx.measureText(packet.char).actualBoundingBoxAscent;
            this.ctx.fillText(packet.char, packet.x - (x / 2), packet.y + (y / 2));
        });

        // @ts-ignore
        this.socket.on(PacketType.FREE_DRAW, (packet: FreeDraw) => {
            const id = packet.socketId;
            this.checkRemote(id);

            // From last part to current poss
            if (this.remote[id].currentFreeLine.parts.length) {
                const last = {
                    x: this.remote[id].currentFreeLine.parts[this.remote[id].currentFreeLine.parts.length - 1].x,
                    y: this.remote[id].currentFreeLine.parts[this.remote[id].currentFreeLine.parts.length - 1].y
                };

                this.ctx.beginPath();

                // Corupted path on corners - add one px
                if (packet.movementX < 0) { last.x++; }
                else if (packet.movementX > 0) { last.x--; }
                if (packet.movementY < 0) { last.y++; }
                else if (packet.movementY > 0) { last.y--; }

                this.ctx.moveTo(last.x, last.y);
                this.ctx.lineTo(packet.x, packet.y);
                this.ctx.strokeStyle = packet.color;
                this.ctx.stroke();
            }

            // Add Part to free line
            this.remote[id].currentFreeLine.parts.push({
                x: packet.x,
                y: packet.y
            });

        });

        // @ts-ignore
        this.socket.on(PacketType.FREE_END, (packet: FreeEnd) => {
            const id = packet.socketId;
            this.checkRemote(id);

            // Add FreeLine
            this.remote[id].currentFreeLine.color = packet.color;
            this.remote[id].freeLines.push(JSON.parse(JSON.stringify(this.remote[id].currentFreeLine)));
            this.remote[id].currentFreeLine.parts = [];
        });

        // @ts-ignore
        this.socket.on(PacketType.CLEAR, (packet: Packet) => {
            this.clear(false);
        });

        // @ts-ignore
        this.socket.on(PacketType.NEWMAXSIZE, (packet: Resize) => {
            this.drawMaxVisibleForOthers(packet.x, packet.y);
        });

        // @ts-ignore
        this.socket.on(PacketType.STRAIGHT_PREDICT, (packet: StraightPredict) => {
            const id = packet.socketId;
            this.checkRemote(id);

            // Clear prredict canvas
            this.ctx2.clearRect(0, 0, this.predictCanvas.width, this.predictCanvas.height);

            // Save this predict
            this.remote[id].straightPredict.start = packet.start;
            this.remote[id].straightPredict.end = packet.end;
            this.remote[id].straightPredict.color = packet.color;

            // Draw all remote predict
            for (const id in this.remote) {
                const client = this.remote[id];

                if (client.straightPredict.start.x === -1) { continue; }

                this.ctx2.beginPath();
                this.ctx2.moveTo(client.straightPredict.start.x, client.straightPredict.start.y);
                this.ctx2.lineTo(client.straightPredict.end.x, client.straightPredict.end.y);
                this.ctx2.strokeStyle = client.straightPredict.color;
                this.ctx2.stroke();
            }

            // Draw local predict
            if (this.local[0].straightPredict.start.x !== -1) {
                this.ctx2.beginPath();
                this.ctx2.moveTo(this.local[0].straightPredict.start.x, this.local[0].straightPredict.start.y);
                this.ctx2.lineTo(this.local[0].straightPredict.end.x, this.local[0].straightPredict.end.y);
                this.ctx2.strokeStyle = this.local[0].straightPredict.color;
                this.ctx2.stroke();
            }
        });

        // @ts-ignore
        this.socket.on(PacketType.STRAIGHT_DRAW, (packet: StraightDraw) => {
            this.ctx.beginPath();
            this.ctx.moveTo(packet.start.x, packet.start.y);
            this.ctx.lineTo(packet.end.x, packet.end.y);
            this.ctx.strokeStyle = packet.color;
            this.ctx.stroke();

            const id = packet.socketId;
            this.checkRemote(id);

            // Add Line
            const straight: StraightLine = {
                type: Mode.STRAIGHT,
                start: packet.start,
                end: packet.end,
                color: packet.color
            };
            this.remote[id].straightLines.push(JSON.parse(JSON.stringify(straight)));

            // Remove predict
            this.remote[id].straightPredict.start = {
                x: -1,
                y: -1
            };
            this.remote[id].straightPredict.end = {
                x: -1,
                y: -1
            };

            // TODO history
        });

        // @ts-ignore
        this.socket.on(PacketType.UNDO, (packet: Undo) => {
            const id = packet.socketId;
            this.checkRemote(id);

            // Remove this
            switch (packet.type) {
                case Mode.FREE:
                    this.restory.push(this.remote[id].freeLines.pop());
                    break;
                case Mode.STRAIGHT:
                    this.restory.push(this.remote[id].straightLines.pop());
                    break;
                case Mode.DOT:
                    this.restory.push(this.remote[id].dots.pop());
                    break;
                case Mode.CHAR:
                    this.restory.push(this.remote[id].chars.pop());
                    break;
            }

            // Clear
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.redraw();
        });

        // @ts-ignore
        this.socket.on(PacketType.REDO, (packet: Redo) => {
            const id = packet.socketId;
            this.checkRemote(id);

            // Clear, we are going to redraw ctx
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if (packet.element.type === Mode.FREE) {
                this.remote[id].freeLines.push(packet.element as FreeLine);
                // TODO shared history
            }

            if (packet.element.type === Mode.STRAIGHT) {
                const line: StraightLine = packet.element as StraightLine;
                this.remote[id].straightLines.push(line);
                // TODO shared history
            }

            if (packet.element.type === Mode.DOT) {
                this.remote[id].dots.push(packet.element as Dot);
                // TODO shared history
            }

            if (packet.element.type === Mode.CHAR) {
                this.remote[id].chars.push(packet.element as Char);
                // TODO shared history
            }

            this.redraw();
        });

        this.predictCanvas.onmousedown = (event: MouseEvent) => {
            if (event.button === 0) { this.leftDown = true; }
            else if (event.button === 2) { this.rightDown = true; }

            const poss = this.getMousePoss(event);

            if ((this.mode === Mode.POINT) || ((this.mode === Mode.STRAIGHT) && (event.button === 2))) {
                this.canDraw = false;

                this.addLocationDot(poss, true);

                if (this.mode === Mode.STRAIGHT) {
                    this.local[0].startStraightX = poss.x;
                    this.local[0].startStraightY = poss.y;
                }
                // console.log(poss.x + " " + poss.y + "   |||   " + this.lastPointX + " " + this.lastPointY);

                if ((event.button === 0) && (this.mode === Mode.POINT)) {


                    if ((this.local[0].lastPointX !== -1) && (this.local[0].lastPointX !== -1)) {

                        this.ctx.beginPath();
                        this.ctx.moveTo(this.local[0].lastPointX, this.local[0].lastPointY);
                        this.ctx.lineTo(poss.x, poss.y);
                        this.ctx.strokeStyle = this.currentColor;
                        this.ctx.stroke();

                         // Add StraightLine
                        const straightLine = {
                            type: Mode.STRAIGHT,
                            start: {
                                x: this.local[0].lastPointX,
                                y: this.local[0].lastPointY
                            },
                            end: {
                                x: poss.x,
                                y: poss.y
                            },
                            color: this.currentColor
                        };

                        this.local[0].straightLines.push(JSON.parse(JSON.stringify(straightLine)));
                        // Add to history
                        this.history.push(Mode.STRAIGHT);

                         // Notify others
                        const packet: StraightDraw = {
                            start: {
                                x: this.local[0].lastPointX,
                                y: this.local[0].lastPointY
                            },
                            end: {
                                x: poss.x,
                                y: poss.y
                            },
                            color: this.currentColor,
                            socketId: this.socket.id,
                        };
                        // @ts-ignore
                        this.socket.emit(PacketType.STRAIGHT_DRAW, packet);
                    }
                }

                if (this.mode === Mode.POINT) {
                    this.local[0].lastPointX = poss.x;
                    this.local[0].lastPointY = poss.y;
                    return;
                }
            }

            this.local[0].startX = poss.x;
            this.local[0].startY = poss.y;

            this.canDraw = true;

            if (this.mode === Mode.FREE) {
                this.local[0].currentFreeLine.start.x = this.local[0].startX;
                this.local[0].currentFreeLine.start.y = this.local[0].startY;

                const packet: FreeStart = { x: this.local[0].startX, y: this.local[0].startY, socketId: this.socket.id };
               // @ts-ignore
                this.socket.emit(PacketType.FREE_START, packet);
            }
        };

        this.predictCanvas.oncontextmenu = (event: MouseEvent) => {
            event.preventDefault();
        };

        this.predictCanvas.onmouseup = (event: MouseEvent) => {
            if (event.button === 0) { this.leftDown = false; }
            else if (event.button === 2) { this.rightDown = false; }

            this.canDraw = false;
            const poss = this.getMousePoss(event);

            if (this.mode === Mode.FREE) {
                // Just dot
                if (this.local[0].currentFreeLine.parts.length === 0) {

                    this.ctx.fillStyle = this.currentColor;
                    this.ctx.beginPath();
                    this.ctx.arc(poss.x, poss.y, 4, 0, 2 * Math.PI);
                    this.ctx.fill();

                    this.local[0].dots.push({
                        type: Mode.DOT,
                        x: poss.x,
                        y: poss.y,
                        color: this.currentColor
                    });

                    // Add to history
                    this.history.push(Mode.DOT);

                    const packet: FreeDot = {
                        color: this.currentColor,
                        x: poss.x,
                        y: poss.y,
                        socketId: this.socket.id
                    };

                  // @ts-ignore
                    this.socket.emit(PacketType.FREE_DOT, packet);
                    return;
                }

                // Add FreeLine
                this.local[0].currentFreeLine.color = this.currentColor;
                this.local[0].freeLines.push(JSON.parse(JSON.stringify(this.local[0].currentFreeLine)));
                this.local[0].currentFreeLine.parts = [];
                // Add to history
                this.history.push(Mode.FREE);

                const packet: FreeEnd = { color: this.currentColor, socketId: this.socket.id };
              // @ts-ignore
                this.socket.emit(PacketType.FREE_END, packet);
            }

            if (this.mode === Mode.STRAIGHT) {

                // Remove local predict
                // Save to memory - anti flickering when someonelse doing same
                this.local[0].straightPredict.start = { x: -1, y: -1 };
                this.local[0].straightPredict.end = { x: -1, y: -1 };

                // No draw for right click
                if (event.button === 2) {
                    return;
                }

                this.ctx.beginPath();

                // If not dragging draw line from last point
                if (this.dragging) {
                    this.ctx.moveTo(this.local[0].startX, this.local[0].startY);
                } else {
                    // Could be -1 and then we wanna select start point
                    if ((this.local[0].startStraightX !== -1) && (this.local[0].startStraightY !== -1)) {
                        this.ctx.moveTo(this.local[0].startStraightX, this.local[0].startStraightY);
                    } else {
                        // It's just starting point
                        this.local[0].startStraightX = poss.x;
                        this.local[0].startStraightY = poss.y;

                        this.addLocationDot(poss);
                        // Do not add to history
                        return;
                    }
                }

                this.ctx.lineTo(poss.x, poss.y);
                this.ctx.strokeStyle = this.currentColor;
                this.ctx.stroke();

                // When dragging start location is diffrent than when it's just click
                let x = 0, y = 0;
                if (this.dragging) {
                    x = this.local[0].startStraightX = this.local[0].startX;
                    y = this.local[0].startStraightY = this.local[0].startY;
                } else {
                    x = this.local[0].startStraightX;
                    y = this.local[0].startStraightY;
                }

                this.addLocationDot({x, y}, true);


                // Add StraightLine
                const straightLine = {
                    type: Mode.STRAIGHT,
                    start: {
                        x,
                        y
                    },
                    end: {
                        x: poss.x,
                        y: poss.y
                    },
                    color: this.currentColor
                };

                this.local[0].straightLines.push(JSON.parse(JSON.stringify(straightLine)));
                // Add to history
                this.history.push(Mode.STRAIGHT);

                // Notify others
                const packet: StraightDraw = {
                    start: {
                        x,
                        y
                    },
                    end: {
                        x: poss.x,
                        y: poss.y
                    },
                    color: this.currentColor,
                    socketId: this.socket.id,
                };
              // @ts-ignore
                this.socket.emit(PacketType.STRAIGHT_DRAW, packet);
            }
        };

        this.predictCanvas.onmousemove = (event: MouseEvent) => {
            if ((this.rightDown) || (this.leftDown)) { this.dragging = true; }
            else { this.dragging = false; }

            if ((this.mode === Mode.STRAIGHT) && (this.rightDown)) {
                // No predict for right click
                return;
            }

            if (!this.canDraw) {
                return;
            }

            const poss = this.getMousePoss(event);

            if (this.mode === Mode.FREE) {

                // From last part to current poss
                if (this.local[0].currentFreeLine.parts.length) {
                    const last = {
                        x: this.local[0].currentFreeLine.parts[this.local[0].currentFreeLine.parts.length - 1].x,
                        y: this.local[0].currentFreeLine.parts[this.local[0].currentFreeLine.parts.length - 1].y
                    };

                    this.ctx.beginPath();

                    // Corupted path on corners - add one px
                    if (event.movementX < 0) { last.x++; }
                    else if (event.movementX > 0) { last.x--; }
                    if (event.movementY < 0) { last.y++; }
                    else if (event.movementY > 0) { last.y--; }

                    this.ctx.moveTo(last.x, last.y);
                    this.ctx.lineTo(poss.x, poss.y);
                    this.ctx.strokeStyle = this.currentColor;
                    this.ctx.stroke();
                }

                // Add Part to free line
                this.local[0].currentFreeLine.parts.push({
                    x: poss.x,
                    y: poss.y
                });

                const packet: FreeDraw = {
                    x: poss.x,
                    y: poss.y,
                    socketId: this.socket.id,
                    color: this.currentColor,
                    movementY: event.movementY,
                    movementX: event.movementX
                };

              // @ts-ignore
                this.socket.emit(PacketType.FREE_DRAW, packet);
            }

            if ((this.mode === Mode.STRAIGHT) && (this.dragging)) {

                // Clear
                this.ctx2.clearRect(0, 0, this.predictCanvas.width, this.predictCanvas.height);
                // Draw all remote predict
                for (const id in this.remote) {
                    const client = this.remote[id];
                    if (client.straightPredict.start.x === -1) { continue; }
                    this.ctx2.beginPath();
                    this.ctx2.moveTo(client.straightPredict.start.x, client.straightPredict.start.y);
                    this.ctx2.lineTo(client.straightPredict.end.x, client.straightPredict.end.y);
                    this.ctx2.strokeStyle = client.straightPredict.color;
                    this.ctx2.stroke();
                }

                // Draw local predict
                this.ctx2.beginPath();
                this.ctx2.moveTo(this.local[0].startX, this.local[0].startY);
                this.ctx2.lineTo(poss.x, poss.y);
                this.ctx2.strokeStyle = this.currentColor;
                this.ctx2.stroke();

                const packet: StraightPredict = {
                    start: {
                        x: this.local[0].startX,
                        y: this.local[0].startY,
                    },
                    end: {
                        x: poss.x,
                        y: poss.y
                    },
                    color: this.currentColor,
                    socketId: this.socket.id,
                };
                // Notify others
              // @ts-ignore
                this.socket.emit(PacketType.STRAIGHT_PREDICT, packet);
                // Save to memory - anti flickering when someonelse doing same
                this.local[0].straightPredict.start = packet.start;
                this.local[0].straightPredict.end = packet.end;
                this.local[0].straightPredict.color = packet.color;
            }
        };

        this.predictCanvas.ontouchstart = (event: TouchEvent) => {
            this.canDraw = true;
            const poss = this.getTouchPoss(event.touches.item(0));
            this.local[0].startX = poss.x;
            this.local[0].startY = poss.y;

            if (this.mode === Mode.FREE) {
                this.local[0].currentFreeLine.start.x = this.local[0].startX;
                this.local[0].currentFreeLine.start.y = this.local[0].startY;

                const packet: FreeStart = { x: this.local[0].startX, y: this.local[0].startY, socketId: this.socket.id };
              // @ts-ignore
                this.socket.emit(PacketType.FREE_START, packet);
            }
        };

        this.predictCanvas.ontouchend = (event: TouchEvent) => {
            this.canDraw = false;

            // Don't know howthefuck is this possible
            /*if (event.touches.length === 0) {
                this.local[0].currentFreeLine.parts = [];
                return;
            }*/

            if (this.mode === Mode.FREE) {

                // Just dot
                if ((event.touches.length !== 0) && (this.local[0].currentFreeLine.parts.length === 0)) {

                    const poss = this.getTouchPoss(event.touches.item(0));

                    this.ctx.fillStyle = this.currentColor;
                    this.ctx.beginPath();
                    this.ctx.arc(poss.x, poss.y, 4, 0, 2 * Math.PI);
                    this.ctx.fill();

                    this.local[0].dots.push({
                        type: Mode.DOT,
                        x: poss.x,
                        y: poss.y,
                        color: this.currentColor
                    });

                    // Add to history
                    this.history.push(Mode.DOT);

                    const packet: FreeDot = {
                        color: this.currentColor,
                        x: poss.x,
                        y: poss.y,
                        socketId: this.socket.id
                    };

                  // @ts-ignore
                    this.socket.emit(PacketType.FREE_DOT, packet);
                    return;
                }

                // Add FreeLine
                this.local[0].currentFreeLine.color = this.currentColor;
                this.local[0].freeLines.push(JSON.parse(JSON.stringify(this.local[0].currentFreeLine)));
                this.local[0].currentFreeLine.parts = [];
                // Add to history
                this.history.push(Mode.FREE);

                const packet: FreeEnd = { color: this.currentColor, socketId: this.socket.id };
              // @ts-ignore
                this.socket.emit(PacketType.FREE_END, packet);
            }
        };

        this.predictCanvas.ontouchmove = (event: TouchEvent) => {
            if (!this.canDraw) { return; }

            for (let index = 0; index < event.touches.length; index++)  {
                const touch: Touch = event.touches.item(index);
                const poss = this.getTouchPoss(touch);

                if (this.mode === Mode.FREE) {

                    let movementX = 0;
                    let movementY = 0;

                    // From last part to current poss
                    if (this.local[0].currentFreeLine.parts.length) {
                        const last = {
                            x: this.local[0].currentFreeLine.parts[this.local[0].currentFreeLine.parts.length - 1].x,
                            y: this.local[0].currentFreeLine.parts[this.local[0].currentFreeLine.parts.length - 1].y
                        };

                        this.ctx.beginPath();

                        movementX = poss.x - last.x;
                        movementY = poss.y - last.y;

                        // Corupted path on corners - add one px
                        if (movementX < 0) { last.x++; }
                        else if (movementX > 0) { last.x--; }
                        if (movementY < 0) { last.y++; }
                        else if (movementY > 0) { last.y--; }

                        this.ctx.moveTo(last.x, last.y);
                        this.ctx.lineTo(poss.x, poss.y);
                        this.ctx.strokeStyle = this.currentColor;
                        this.ctx.stroke();
                    }

                    // Add Part to free line
                    this.local[0].currentFreeLine.parts.push({
                        x: poss.x,
                        y: poss.y
                    });

                    const packet: FreeDraw = {
                        x: poss.x,
                        y: poss.y,
                        socketId: this.socket.id,
                        color: this.currentColor,
                        movementY,
                        movementX
                    };

                  // @ts-ignore
                    this.socket.emit(PacketType.FREE_DRAW, packet);
                }
            }
        };

        window.onmousemove = (event: MouseEvent) => {
            const poss = this.getMousePoss(event);
            this.local[0].cursorX = poss.x;
            this.local[0].cursorY = poss.y;
        };

        window.onkeydown = (event: KeyboardEvent) => {
            if ((this.local[0].cursorY === -1) || (this.local[0].cursorX === -1)) { return; }

            if (event.key === 'Shift') { return; }
            if (event.key === 'Control') { return; }
            if (event.key === 'Backspace') { return; }
            if (event.key === 'Escape') { return; }
            if (event.key === 'CapsLock') { return; }
            if (event.key === 'Tab') { return; }
            if (event.key === 'Meta') { return; }
            if (event.key === 'NumLock') { return; }
            if (event.key === 'ScrollLock') { return; }
            if (event.key === 'Enter') { return; }
            if (event.key === 'PageDown') { return; }
            if (event.key === 'PageUp') { return; }
            if (event.key === 'End') { return; }
            if (event.key === 'ContextMenu') { return; }
            if (event.key === 'Home') { return; }
            if (event.key === 'AltGraph') { return; }
            if (event.key === 'ArrowLeft') { return; }
            if (event.key === 'ArrowRight') { return; }
            if (event.key === 'ArrowUp') { return; }
            if (event.key === 'ArrowDown') { return; }
            if (event.key === 'Delete') { return; }
            if (event.key === 'Insert') { return; }
            if (event.key === 'Pause') { return; }
            if (event.key === 'Clear') { return; }
            if (event.key === 'Dead') { return; }
            if (event.key === 'Alt') { return; }
            if (event.key === 'Alt') { return; }

            this.ctx.font = '50px Comic Sans MS';
            this.ctx.fillStyle = this.currentColor;
            const x = this.ctx.measureText(event.key).width;
            const y = this.ctx.measureText(event.key).actualBoundingBoxAscent;
            this.ctx.fillText(event.key, this.local[0].cursorX - (x / 2), this.local[0].cursorY + (y / 2));

            this.local[0].chars.push({
                type: Mode.CHAR,
                x: this.local[0].cursorX,
                y: this.local[0].cursorY,
                color: this.currentColor,
                char: event.key
            });

            // Emit
            const p: CharDraw = {
                x: this.local[0].cursorX,
                y: this.local[0].cursorY,
                color: this.currentColor,
                char: event.key,
                socketId: this.socket.id
            };
          // @ts-ignore
            this.socket.emit(PacketType.CHAR_DRAW, p);

            // Add to history
            this.history.push(Mode.CHAR);
            console.log('Ddoano');

        };

    }

    private checkRemote(id: string): void {
        if (!!this.remote[id]) { return; }
        this.remote[id] = {
            startX: -1,
            startY: -1,
            straightPredict: {
                start: {
                    x: -1,
                    y: -1
                },
                end: {
                    x: -1,
                    y: -1
                },
                color: Color.BLACK,
            },
            chars: [],
            startStraightX: -1,
            startStraightY: -1,
            lastPointX: -1,
            lastPointY: -1,
            freeLines: [],
            currentFreeLine: { type: Mode.FREE, start: { x: 0, y: 0 }, parts: [] } as FreeLine,
            straightLines: [],
            dots: [],
        };
    }

    private addLocationDot(poss: {x: number, y: number}, clearCtx2: boolean = false): void {
        // Location dot
        if (clearCtx2) { this.ctx2.clearRect(0, 0, this.predictCanvas.width, this.predictCanvas.height); }
        this.ctx2.fillStyle = Color.INTERNAL;
        this.ctx2.beginPath();
        this.ctx2.arc(poss.x, poss.y, 10, 0, 2 * Math.PI);
        this.ctx2.fill();
    }

    private getElementPoss(element: HTMLElement): { top: number, left: number } {
        let top = 0;
        let left = 0;

        while (element && element.tagName != 'BODY') {
            top += element.offsetTop - element.scrollTop;
            left += element.offsetLeft - element.scrollLeft;
            element = element.offsetParent as HTMLElement;
        }

        return { top, left };
    }

    private getMousePoss(event: MouseEvent): { x: number, y: number } {
        return {
            x: event.pageX - this.getElementPoss(this.canvas).left,
            y: event.pageY - this.getElementPoss(this.canvas).top
        };
    }

    private getTouchPoss(touch: Touch): { x: number, y: number } {
        return {
            x: touch.pageX - this.getElementPoss(this.canvas).left,
            y: touch.pageY - this.getElementPoss(this.canvas).top
        };
    }

    public setColor(value: string): void {
        for (const color in Color) {
            if (value.toUpperCase() === color) {
                this.currentColor = Color[color];
                this.ctx.strokeStyle = Color[color];
                this.ctx2.strokeStyle = Color[color];
                break;
            }
        }
    }

    public setMode(value: string): void {
        for (const mode in Mode) {
            if (value.toUpperCase() === mode) {
                this.mode = Mode[mode] as unknown as number;

                this.ctx.closePath();
                this.ctx2.closePath();
                this.ctx2.clearRect(0, 0, this.predictCanvas.width, this.predictCanvas.height);

                // Draw all remote predict
                for (const id in this.remote) {
                    const client = this.remote[id];
                    if (client.straightPredict.start.x === -1) { continue; }
                    this.ctx2.beginPath();
                    this.ctx2.moveTo(client.straightPredict.start.x, client.straightPredict.start.y);
                    this.ctx2.lineTo(client.straightPredict.end.x, client.straightPredict.end.y);
                    this.ctx2.strokeStyle = client.straightPredict.color;
                    this.ctx2.stroke();
                }

                this.local[0].lastPointX = -1;
                this.local[0].lastPointY = -1;
                this.local[0].startStraightX = -1;
                this.local[0].startStraightY = -1;
                break;
            }
        }
    }

    private redraw(): void {
        this.ctx2.lineWidth = this.ctx.lineWidth = 5;

        const drawFreeLine = (freeLine: FreeLine) => {
            this.ctx.beginPath();
            this.ctx.moveTo(freeLine.start.x, freeLine.start.y);
            this.ctx.strokeStyle = freeLine.color;

            for (const part of freeLine.parts) {
                this.ctx.lineTo(part.x, part.y);
                this.ctx.stroke();
            }
        };

        const drawStraightLine = (straightLine: StraightLine) => {
            this.ctx.beginPath();
            this.ctx.moveTo(straightLine.start.x, straightLine.start.y);
            this.ctx.strokeStyle = straightLine.color;
            this.ctx.lineTo(straightLine.end.x, straightLine.end.y);
            this.ctx.stroke();
        };

        const drawDot = (dot: Dot) => {
            this.ctx.fillStyle = dot.color;
            this.ctx.beginPath();
            this.ctx.arc(dot.x, dot.y, 4, 0, 2 * Math.PI);
            this.ctx.fill();
        };

        const drawChar = (char: Char) => {

            this.ctx.font = '50px Comic Sans MS';
            this.ctx.fillStyle = char.color;
            const x = this.ctx.measureText(char.char).width;
            const y = this.ctx.measureText(char.char).actualBoundingBoxAscent;
            this.ctx.fillText(char.char, char.x - (x / 2), char.y + (y / 2));
        };

        for (const freeLine of this.local[0].freeLines) {
            drawFreeLine(freeLine);
        }

        for (const straightLine of this.local[0].straightLines) {
            drawStraightLine(straightLine);
        }

        for (const dot of this.local[0].dots) {
            drawDot(dot);
        }

        for (const char of this.local[0].chars) {
            drawChar(char);
        }

        // Redraw remote
        for (const id in this.remote) {
            const client = this.remote[id];

            for (const freeLine of client.freeLines) {
                drawFreeLine(freeLine);
            }

            for (const straightLine of client.straightLines) {
                drawStraightLine(straightLine);
            }

            for (const dot of client.dots) {
                drawDot(dot);
            }

            for (const char of client.chars) {
                drawChar(char);
            }
        }


    }

    private drawMaxVisibleForOthers(x: number, y: number): void {
        // Clear
        this.ctx3.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
        let show = false;
        if (x < this.backgroundCanvas.width) { show = true; }
        if (y < this.backgroundCanvas.height) { show = true; }
        if (!show) { return; }

        // Redraw canvas 3
        this.ctx3.beginPath();
        this.ctx3.moveTo(0, y);
        this.ctx3.strokeStyle = Color.INTERNAL;
        this.ctx3.lineTo(x, y);
        this.ctx3.lineTo(x, 0);
        this.ctx3.stroke();

        // Save for no flickering
        this.lastBorderX = x;
        this.lastBorderY = x;
    }

    public scale(): void {
        // Change size
        this.backgroundCanvas.height = this.predictCanvas.height = this.canvas.height = this.canvas.parentElement.offsetHeight;
        this.backgroundCanvas.width = this.predictCanvas.width = this.canvas.width = this.canvas.parentElement.offsetWidth;

        // Clear
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx2.clearRect(0, 0, this.predictCanvas.width, this.predictCanvas.height);
        this.redraw();

        // Notify server
      // @ts-ignore
        this.socket.emit(PacketType.RESIZE, {
            x: this.canvas.width,
            y: this.canvas.height - this.canvas.parentElement.parentElement.firstElementChild.firstElementChild.clientHeight
        });

        // Show again border
        let show = false;
        if (this.lastBorderX < this.backgroundCanvas.width) { show = true; }
        if (this.lastBorderY < this.backgroundCanvas.height) { show = true; }
        if (!show) { return; }

        // Redraw canvas 3
        this.ctx3.beginPath();
        this.ctx3.moveTo(0, this.lastBorderY);
        this.ctx3.strokeStyle = Color.INTERNAL;
        this.ctx3.lineTo(this.lastBorderX, this.lastBorderY);
        this.ctx3.lineTo(this.lastBorderX, 0);
        this.ctx3.stroke();
    }

    public undo(): void {
        if (!this.history.length) { return; }
        const type: Mode = this.history.pop();

        // Notify others
        const packet: Undo = {
            type,
            socketId: this.socket.id
        };
      // @ts-ignore
        this.socket.emit(PacketType.UNDO, packet);

        switch (type) {
            case Mode.FREE:
                this.restory.push(this.local[0].freeLines.pop());
                break;
            case Mode.STRAIGHT:
                this.restory.push(this.local[0].straightLines.pop());
                break;
            case Mode.DOT:
                this.restory.push(this.local[0].dots.pop());
                break;
            case Mode.CHAR:
                this.restory.push(this.local[0].chars.pop());
        }

        // Clear
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx2.clearRect(0, 0, this.predictCanvas.width, this.predictCanvas.height);
        this.redraw();

        // Redo location dot if required
        if ((this.mode !== Mode.POINT) && (this.mode !== Mode.STRAIGHT)) {
            return;
        }

        // Have to check if last one was same as tool mode
        const last: Mode = this.history[this.history.length - 1];
        if (last !== Mode.STRAIGHT) {
            // Clear path of POINT mode
            this.local[0].lastPointX = -1;
            this.local[0].lastPointY = -1;
            // Clear path for STRAIGHT
            this.local[0].startStraightX = -1;
            this.local[0].startStraightY = -1;
            this.ctx.closePath();
        }

        if (!this.local[0].straightLines.length) { return; }

        // Get location
        let x = 0, y = 0;
        if (this.mode === Mode.POINT) {
            x = this.local[0].lastPointX = this.local[0].straightLines[this.local[0].straightLines.length - 1].end.x;
            y = this.local[0].lastPointY = this.local[0].straightLines[this.local[0].straightLines.length - 1].end.y;
        } else if (this.mode === Mode.STRAIGHT) {
            x = this.local[0].startStraightX = this.local[0].straightLines[this.local[0].straightLines.length - 1].start.x;
            y = this.local[0].startStraightY = this.local[0].straightLines[this.local[0].straightLines.length - 1].start.y;
        }

        // Redo location dot
        this.ctx2.fillStyle = Color.INTERNAL;
        this.ctx2.beginPath();
        this.ctx2.arc(x, y, 10, 0, 2 * Math.PI);
        this.ctx2.fill();
    }

    public redo(): void {
        if (!this.restory.length) { return; }
        const element: FreeLine | StraightLine | Dot | Char = this.restory.pop();

        // Notify others
        const packet: Redo = {
            element,
            socketId: this.socket.id,
        };
      // @ts-ignore
        this.socket.emit(PacketType.REDO, packet);

        // Clear
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx2.clearRect(0, 0, this.predictCanvas.width, this.predictCanvas.height);

        if (element.type === Mode.FREE) {
            this.local[0].freeLines.push(element as FreeLine);
            this.history.push(Mode.FREE);
        }

        if (element.type === Mode.STRAIGHT) {
            const line: StraightLine = element as StraightLine;
            this.local[0].straightLines.push(line);
            this.history.push(Mode.STRAIGHT);

            // Diffrent using diffrent modes
            let x = 0, y = 0;
            if (this.mode === Mode.STRAIGHT) {
                x = line.start.x;
                y = line.start.y;
            } else if (this.mode === Mode.POINT) {
                x = this.local[0].lastPointX = line.end.x;
                y = this.local[0].lastPointY = line.end.y;
            }

            // Redo location dot
            this.ctx2.fillStyle = Color.INTERNAL;
            this.ctx2.beginPath();
            this.ctx2.arc(x, y, 10, 0, 2 * Math.PI);
            this.ctx2.fill();
        }

        if (element.type === Mode.DOT) {
            this.local[0].dots.push(element as Dot);
            this.history.push(Mode.DOT);
        }

        if (element.type === Mode.CHAR) {
            this.local[0].chars.push(element as Char);
            this.history.push(Mode.CHAR);
        }

        this.redraw();
    }

    public clear(emit: boolean = true): void {
        this.ctx.closePath();
        this.ctx2.closePath();
        this.ctx.beginPath();
        this.ctx2.beginPath();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx2.clearRect(0, 0, this.predictCanvas.width, this.predictCanvas.height);
        this.history = [];
        this.restory = [];
        this.local[0].straightLines = [];
        this.local[0].dots = [];
        this.local[0].freeLines = [];
        this.local[0].lastPointX = -1;
        this.local[0].lastPointY = -1;
        this.local[0].startStraightX = -1;
        this.local[0].startStraightY = -1;
        this.local[0].chars = [];
        this.remote = [];
        this.redraw();

        if (!emit) { return; }

        // Notify others
        const packet: Packet = { socketId: this.socket.id };
      // @ts-ignore
        this.socket.emit(PacketType.CLEAR, packet);
    }

    public changeServerAddress(value: string): void {
        this.clear();
        console.log('Connecting to ' + value);
        this.socket = io(value);
    }
}
