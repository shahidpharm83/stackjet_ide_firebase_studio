
"use client"

import * as React from "react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { AgenticFlowOutput } from "@/ai/flows/agentic-flow"

type OperationSummaryChartProps = {
  plan: AgenticFlowOutput['plan'];
};

const chartConfig = {
  write: { label: "Writes", color: "hsl(var(--chart-1))" },
  edit: { label: "Edits", color: "hsl(var(--chart-2))" },
  delete: { label: "Deletes", color: "hsl(var(--chart-3))" },
  rename: { label: "Renames", color: "hsl(var(--chart-4))" },
  move: { label: "Moves", color: "hsl(var(--chart-5))" },
  command: { label: "Commands", color: "hsl(var(--muted))" },
  value: { label: "Count" }
} satisfies ChartConfig

export default function OperationSummaryChart({ plan }: OperationSummaryChartProps) {
    const data = React.useMemo(() => {
        const counts = plan.reduce((acc, step) => {
            const action = 'action' in step ? step.action : 'command';
            acc[action] = (acc[action] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([key, value]) => ({
            name: (chartConfig as any)[key]?.label || key,
            value: value,
            fill: `var(--color-${key})`
        }));
    }, [plan]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Operations Breakdown</CardTitle>
        <CardDescription>A summary of actions taken.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart accessibilityLayer data={data}>
             <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar dataKey="value" radius={4}>
                {data.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
