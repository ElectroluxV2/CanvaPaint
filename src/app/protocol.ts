
export enum PacketType {
    FREE_START = 0,
    FREE_DRAW = 1,
    FREE_END = 2,
    CLEAR = 3,
    FREE_DOT = 4,
    RESIZE = 5,
    NEWMAXSIZE = 6,
    STRAIGHT_PREDICT = 7,
    STRAIGHT_DRAW = 8,
    UNDO = 9,
    REDO = 10,
    CHAR_DRAW = 11,
}

export enum Color {
    RED = '#f44336',
    BLUE = '#2196f3',
    GREEN = '#4caf50',
    YELLOW = '#ffeb3b',
    BLACK = '#212121',
    INTERNAL = '#673ab7'
}

export enum Mode {
    FREE = 0,
    STRAIGHT = 1,
    POINT = 2,
    SQUARE = 3,
    CIRCLE = 4,
    DOT = 5,
    CHAR = 6,
}

export interface FreeLine {
    type: Mode;
    start: {
        x: number;
        y: number;
    };
    parts: Part[];
    color: Color;
}

export interface Char {
    type: Mode;
    char: string;
    x: number;
    y: number;
    color: Color;
}

export interface StraightLine {
    type: Mode;
    start: {
        x: number;
        y: number;
    };
    end: {
        x: number;
        y: number;
    };
    color: Color;
}

export interface Dot {
    type: Mode;
    x: number;
    y: number;
    color: Color;
}

interface Part {
    x: number;
    y: number;
}

export interface Packet {
    socketId: string;
    // type: PacketType;
}

export interface CharDraw extends Packet {
    x: number;
    y: number;
    color: Color;
    char: string;
}

export interface FreeStart extends Packet {
    x: number;
    y: number;
}

export interface FreeDraw extends Packet {
    movementX: number;
    movementY: number;
    x: number;
    y: number;
    color: Color;
}

export interface FreeEnd extends Packet {
    color: Color;
}

export interface FreeDot extends Packet {
    x: number;
    y: number;
    color: Color;
}

export interface Resize extends Packet {
    x: number;
    y: number;
}

export interface StraightPredict extends Packet {
    start: {
        x: number;
        y: number;
    };
    end: {
        x: number;
        y: number;
    };
    color: Color;
}

export interface StraightDraw extends Packet {
    start: {
        x: number;
        y: number;
    };
    end: {
        x: number;
        y: number;
    };
    color: Color;
}

export interface Undo extends Packet {
    type: Mode;
}

export interface Redo extends Packet {
    element: FreeLine | StraightLine | Dot | Char;
}
