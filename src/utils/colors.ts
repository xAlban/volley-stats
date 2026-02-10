import {
  DataType,
  DataTypeValues,
  Notation,
  NotationValues,
  NotionNotation,
  NotionNotationValues,
} from '../types'

export const getColorFromStats = (type: DataType, value: Notation) => {
  switch (type) {
    case DataTypeValues.SERVE:
      switch (value) {
        case NotationValues.HASHTAG:
          return 'var(--chart-1)'
        case NotationValues.PLUS:
          return 'var(--chart-3)'
        case NotationValues.MINUS:
          return 'var(--chart-4)'
        case NotationValues.EQUAL:
          return 'var(--chart-5)'
        case NotationValues.EXCLAMATION:
          return 'var(--chart-6)'
        case NotationValues.SLASH:
          return 'var(--chart-2)'
      }
      break
    default:
      switch (value) {
        case NotationValues.HASHTAG:
          return 'var(--chart-1)'
        case NotationValues.PLUS:
          return 'var(--chart-2)'
        case NotationValues.MINUS:
          return 'var(--chart-3)'
        case NotationValues.EQUAL:
          return 'var(--chart-4)'
        case NotationValues.EXCLAMATION:
          return 'var(--chart-5)'
        case NotationValues.SLASH:
          return 'var(--chart-6)'
      }
  }
}

export const getNotionColorFromStats = (
  type: DataType,
  value: NotionNotation,
) => {
  switch (value) {
    case NotionNotationValues.DOUBLE_PLUS:
      return 'var(--chart-1)'
    case NotionNotationValues.PLUS:
      return 'var(--chart-2)'
    case NotionNotationValues.MINUS:
      return 'var(--chart-4)'
    case NotionNotationValues.SLASH:
      return 'var(--chart-6)'
  }
}
