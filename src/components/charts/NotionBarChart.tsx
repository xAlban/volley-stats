import { useMemo } from 'react'
import {
  NotionChartData,
  NotionDataRow,
  DataType,
  NotionNotationValues,
} from '../../types'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '../ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { getNotionColorFromStats } from '../../utils/colors'

const chartConfig = {
  name: {
    label: 'Name',
  },
} satisfies ChartConfig

interface NotionBarChartProps {
  dataRows: NotionDataRow[]
  type?: DataType
  stackBars?: boolean
}

export default function NotionBarChart(props: NotionBarChartProps) {
  const { dataRows, type, stackBars } = props
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
    <ChartContainer config={chartConfig} style={{ height: 500, width: '100%' }}>
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
