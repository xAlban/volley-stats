export type Notation = '#' | '+' | '-' | '=' | '!' | '/';
export type DataType = 'attaque' | 'service' | 'défense' | 'réception' | 'bloc';

export enum NotationValues {
    HASHTAG = '#',
    PLUS = '+',
    MINUS = '-',
    EQUAL = '=',
    EXCLAMATION = '!',
    SLASH = '/',
}
export enum DataTypeValues {
    ATTACK = 'attaque',
    SERVE = 'service',
    DEFENSE = 'défense',
    RECEP = 'réception',
    BLOCK = 'bloc',
}

export interface DataRow {
    name: string
    value: Notation
    type: DataType
}

export interface ChartData {
    name: string
    '#': number
    '+': number
    '-': number
    '=': number
    '!': number
    '/': number
}