import { useMemo } from "react";
import { ChartData, DataRow, DataType, NotationValues } from "../../types";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "../ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { getColorFromStats } from "../../utils/colors";

const chartConfig = {
    name: {
        label: "Name",
    },
} satisfies ChartConfig;

interface AttackChartProps {
    dataRows: DataRow[];
    type?: DataType;
    stackBars?: boolean;
}

export default function CustomBarChart(props: AttackChartProps) {
    const { dataRows, type, stackBars } = props;
    const chartData = useMemo(() => {
        const localData: ChartData[] = [];
        dataRows
            .filter((row) => (type ? row.type === type : true))
            .forEach((row) => {
                const foundIndex = localData.findIndex(
                    (attData) => attData.name === row.name
                );
                if (foundIndex !== -1) {
                    localData[foundIndex] = {
                        ...localData[foundIndex],
                        [row.value]: localData[foundIndex][row.value] + 1,
                    };

                    return;
                }

                localData.push({
                    name: row.name,
                    "+": row.value === "+" ? 1 : 0,
                    "#": row.value === "#" ? 1 : 0,
                    "-": row.value === "-" ? 1 : 0,
                    "/": row.value === "/" ? 1 : 0,
                    "=": row.value === "=" ? 1 : 0,
                    "!": row.value === "!" ? 1 : 0,
                });
            });
        return localData;
    }, [dataRows, type]);
    return (
        <ChartContainer
            config={chartConfig}
            style={{ height: 500, width: "100%" }}
        >
            <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                />
                <YAxis tickLine={false} tickMargin={10} width={30}/>
                <ChartTooltip content={<ChartTooltipContent />} />
                {type &&
                    Object.values(NotationValues).map((value) => (
                        <Bar
                            dataKey={value}
                            fill={getColorFromStats(type, value)}
                            radius={4}
                            stackId={stackBars ? "a" : undefined}
                        />
                    ))}
            </BarChart>
        </ChartContainer>
    );
}
