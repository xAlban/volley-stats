import { useMemo } from 'react'
import { ChartData, DataRow, DataType, NotationValues } from '../../types'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '../ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { getColorFromStats } from '../../utils/colors'

const chartConfig = {
  '#': { label: 'Ace/Kill', color: 'var(--stat-excellent)' },
  '+': { label: 'Positive', color: 'var(--stat-positive)' },
  '=': { label: 'Error', color: 'var(--stat-error)' },
  '/': { label: 'Negative', color: 'var(--stat-negative)' },
  '!': { label: 'Neutral', color: 'var(--stat-neutral)' },
  '-': { label: 'Bad', color: 'var(--stat-attempt)' },
} satisfies ChartConfig

interface AttackChartProps {
  dataRows: DataRow[]
  type?: DataType
  stackBars?: boolean
}

export default function CustomBarChart(props: AttackChartProps) {
  const { dataRows, type, stackBars } = props
  const chartData = useMemo(() => {
    const localData: ChartData[] = []
    dataRows
      .filter((row) => (type ? row.type === type : true))
      .forEach((row) => {
        const foundIndex = localData.findIndex(
          (attData) => attData.name === row.name,
        )
        if (foundIndex !== -1) {
          localData[foundIndex] = {
            ...localData[foundIndex],
            [row.value]: localData[foundIndex][row.value] + 1,
          }

          return
        }

        localData.push({
          name: row.name,
          '+': row.value === '+' ? 1 : 0,
          '#': row.value === '#' ? 1 : 0,
          '-': row.value === '-' ? 1 : 0,
          '/': row.value === '/' ? 1 : 0,
          '=': row.value === '=' ? 1 : 0,
          '!': row.value === '!' ? 1 : 0,
        })
      })
    return localData.sort((a, b) => a.name.localeCompare(b.name))
  }, [dataRows, type])
  return (
    <ChartContainer
      config={chartConfig}
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
          Object.values(NotationValues).map((value) => (
            <Bar
              key={value}
              dataKey={value}
              fill={getColorFromStats(type, value)}
              radius={4}
              stackId={stackBars ? 'a' : undefined}
            />
          ))}
      </BarChart>
    </ChartContainer>
  )
}
