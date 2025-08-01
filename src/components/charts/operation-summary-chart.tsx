
"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"

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
  ChartLegend,
  ChartLegendContent
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
} satisfies ChartConfig

export default function OperationSummaryChart({ plan }: OperationSummaryChartProps) {
    const [activeKey, setActiveKey] = React.useState<string | null>(null);

    const data = React.useMemo(() => {
        const counts = plan.reduce((acc, step) => {
            const action = 'action' in step ? step.action : 'command';
            acc[action] = (acc[action] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([key, value]) => ({
            name: key,
            value: value,
            fill: (chartConfig as any)[key]?.color || "hsl(var(--muted-foreground))"
        }));
    }, [plan]);

  const activeIndex = React.useMemo(
    () => data.findIndex((item) => item.name === activeKey),
    [activeKey, data]
  );

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Operations Breakdown</CardTitle>
        <CardDescription>A summary of actions taken.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={activeIndex}
              activeShape={({ outerRadius = 0, ...props }) => (
                <g>
                  <g>
                    <g>
                       <g transform={props.transform}>
                        <path d={props.d} fill={props.fill} />
                       </g>
                    </g>
                  </g>
                  <g>
                    <g>
                       <g transform={props.transform}>
                        <path d={props.d} stroke={props.fill} strokeWidth={2} />
                       </g>
                    </g>
                  </g>
                </g>
              )}
            >
             {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
            ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
