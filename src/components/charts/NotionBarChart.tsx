import { useMemo } from 'react'
import {
  NotionChartData,
  NotionDataRow,
  DataType,
  NotionNotationValues,
  notionNotationLabels,
} from '../../types'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '../ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { getNotionColorFromStats } from '../../utils/colors'

interface NotionBarChartProps {
  dataRows: NotionDataRow[]
  type?: DataType
  stackBars?: boolean
}

export default function NotionBarChart(props: NotionBarChartProps) {
  const { dataRows, type, stackBars } = props

  const config = useMemo(() => {
    if (!type) {
      return {
        '++': { label: 'Excellent' },
        '+': { label: 'Positive' },
        '-': { label: 'Bad' },
        '/': { label: 'Error' },
      } satisfies ChartConfig
    }
    const labels = notionNotationLabels[type]
    return {
      '++': { label: labels['++'] },
      '+': { label: labels['+'] },
      '-': { label: labels['-'] },
      '/': { label: labels['/'] },
    } satisfies ChartConfig
  }, [type])

  const chartData = useMemo(() => {
    const localData: NotionChartData[] = []
    dataRows
      .filter((row) => (type ? row.type === type : true))
      .forEach((row) => {
        const foundIndex = localData.findIndex((item) => item.name === row.name)
        if (foundIndex !== -1) {
          localData[foundIndex] = {
            ...localData[foundIndex],
            [row.value]: localData[foundIndex][row.value] + 1,
          }
          return
        }

        localData.push({
          name: row.name,
          '++': row.value === '++' ? 1 : 0,
          '+': row.value === '+' ? 1 : 0,
          '-': row.value === '-' ? 1 : 0,
          '/': row.value === '/' ? 1 : 0,
        })
      })
    return localData
  }, [dataRows, type])

  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-[300px] w-full md:h-[350px]"
    >
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis tickLine={false} tickMargin={10} width={30} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {type &&
          Object.values(NotionNotationValues).map((value) => (
            <Bar
              key={value}
              dataKey={value}
              fill={getNotionColorFromStats(type, value)}
              radius={4}
              stackId={stackBars ? 'a' : undefined}
            />
          ))}
      </BarChart>
    </ChartContainer>
  )
}
