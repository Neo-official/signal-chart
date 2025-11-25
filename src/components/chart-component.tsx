"use client"

import { useState, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Brush } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DeviceType } from "@/types";
import { client } from "@/lib/api-client";

type ChartComponentProps = {
	title: string;
	data: DeviceType['data'];
	labels: DeviceType['labels'];
}

const TIME_RANGES = [
	{ label: '1Min', value: 60 },
	{ label: '5Min', value: 300 },
	{ label: '10Min', value: 600 },
	{ label: '15Min', value: 900 },
	{ label: '1Hr', value: 3600 },
	{ label: '1Day', value: 86400 },
	{ label: '1Week', value: 604800 },
	{ label: '1Month', value: 2592000 },
	{ label: '1Year', value: 31536000 },
	{ label: 'All', value: -1 }
];

const CHART_COLORS = {
	vo: '#3b82f6',
	io: '#ef4444'
};

export function ChartComponent({ data, labels }: ChartComponentProps) {
	const [selectedRange, setSelectedRange] = useState(300);
	const [maxPoints, setMaxPoints] = useState(300);
	const [brushIndex, setBrushIndex] = useState<{ startIndex?: number; endIndex?: number }>({});

	const getDataTimeSpan = useMemo(() => {
		if (!labels || labels.length < 2) return 0;
		const first = new Date(labels[0]).getTime();
		const last = new Date(labels[labels.length - 1]).getTime();
		return Math.floor((last - first) / 1000);
	}, [labels]);

	useEffect(() => {
		client.settings.get()
			.then(settings => {
				if (settings.defaultTimeRange) setSelectedRange(settings.defaultTimeRange);
				if (settings.maxDataSend) setMaxPoints(settings.maxDataSend);
			})
			.catch(console.error);
	}, []);

	const chartData = useMemo(() => {
		let fullData = labels.map((timestamp, index) => ({
			time: new Date(timestamp).toLocaleTimeString(),
			timestamp: new Date(timestamp).getTime(),
			vo: data[index]?.[0] || 0,
			io: data[index]?.[1] || 0,
		}));

		if (selectedRange !== -1) {
			const now = fullData[fullData.length - 1]?.timestamp || Date.now();
			const cutoff = now - (selectedRange * 1000);
			fullData = fullData.filter(d => d.timestamp >= cutoff);
		}

		if (fullData.length <= maxPoints) return fullData;

		const step = Math.ceil(fullData.length / maxPoints);
		const sampled = [];
		for (let i = 0; i < fullData.length; i += step) {
			const chunk = fullData.slice(i, i + step);
			const avgVo = chunk.reduce((sum, d) => sum + d.vo, 0) / chunk.length;
			const avgIo = chunk.reduce((sum, d) => sum + d.io, 0) / chunk.length;
			sampled.push({
				time: chunk[Math.floor(chunk.length / 2)].time,
				timestamp: chunk[Math.floor(chunk.length / 2)].timestamp,
				vo: avgVo,
				io: avgIo
			});
		}
		return sampled;
	}, [data, labels, selectedRange, maxPoints]);

	const chartConfig = {
		vo: { label: "Voltage (kV)", color: CHART_COLORS.vo },
		io: { label: "Current (mA)", color: CHART_COLORS.io },
	};

	const exportChart = () => {
		const csv = ['Time,Voltage (kV),Current (mA)', ...chartData.map(d => `${d.time},${d.vo},${d.io}`)].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `chart-${Date.now()}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	if (!data?.length || !labels?.length) {
		return (
			<div className="w-full h-[400px] flex items-center justify-center border rounded-lg">
				<p className="text-muted-foreground">No data available</p>
			</div>
		);
	}

	return (
		<div className="w-full space-y-3">
			<div className="flex flex-wrap gap-2 items-center justify-between">
				<ButtonGroup>
					{TIME_RANGES.map(range => {
						const isDisabled = range.value !== -1 && range.value > getDataTimeSpan;
						return (
							<Button
								key={range.value}
								size="sm"
								variant={selectedRange === range.value ? "default" : "outline"}
								onClick={() => setSelectedRange(range.value)}
								disabled={isDisabled}
							>
								{range.label}
							</Button>
						);
					})}
				</ButtonGroup>
				<Button size="sm" variant="outline" onClick={exportChart}>
					<Download className="w-4 h-4" />
				</Button>
			</div>
			
			<div className="w-full space-y-4">
				<ChartContainer config={chartConfig} className="h-[300px] w-full">
					<AreaChart data={chartData}>
						<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
						<XAxis 
							dataKey="time" 
							stroke="hsl(var(--muted-foreground))"
							tick={{ fill: 'hsl(var(--muted-foreground))' }}
						/>
						<YAxis 
							stroke="hsl(var(--muted-foreground))"
							tick={{ fill: 'hsl(var(--muted-foreground))' }}
							label={{ value: 'kV', angle: -90, position: 'insideLeft' }}
						/>
						<Tooltip content={<ChartTooltipContent />} />
						<Area
							type="monotone" 
							dataKey="vo" 
							stroke={CHART_COLORS.vo}
							fill={CHART_COLORS.vo}
							fillOpacity={0.6}
							name="Vo (kV)" 
							strokeWidth={2}
						/>
					</AreaChart>
				</ChartContainer>

				<ChartContainer config={chartConfig} className="h-[150px] w-full">
					<AreaChart data={chartData}>
						<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
						<XAxis 
							dataKey="time" 
							stroke="hsl(var(--muted-foreground))"
							tick={{ fill: 'hsl(var(--muted-foreground))' }}
						/>
						<YAxis 
							stroke="hsl(var(--muted-foreground))"
							tick={{ fill: 'hsl(var(--muted-foreground))' }}
							label={{ value: 'mA', angle: -90, position: 'insideLeft' }}
						/>
						<Tooltip content={<ChartTooltipContent />} />
						<Area
							type="monotone" 
							dataKey="io" 
							stroke={CHART_COLORS.io}
							fill={CHART_COLORS.io}
							fillOpacity={0.6}
							name="Io (mA)" 
							strokeWidth={2}
						/>
					</AreaChart>
				</ChartContainer>

				<ChartContainer config={chartConfig} className="h-[80px] w-full">
					<AreaChart data={chartData}>
						<XAxis dataKey="time" hide />
						<YAxis hide />
						<Area type="monotone" dataKey="vo" stroke={CHART_COLORS.vo} fill={CHART_COLORS.vo} fillOpacity={0.3} />
						<Area type="monotone" dataKey="io" stroke={CHART_COLORS.io} fill={CHART_COLORS.io} fillOpacity={0.3} />
						<Brush dataKey="time" height={60} stroke="hsl(var(--primary))" startIndex={brushIndex.startIndex} endIndex={brushIndex.endIndex} onChange={(e: any) => setBrushIndex({ startIndex: e.startIndex, endIndex: e.endIndex })}>  
							<AreaChart>
								<Area type="monotone" dataKey="vo" stroke={CHART_COLORS.vo} fill={CHART_COLORS.vo} fillOpacity={0.3} />
								<Area type="monotone" dataKey="io" stroke={CHART_COLORS.io} fill={CHART_COLORS.io} fillOpacity={0.3} />
							</AreaChart>
						</Brush>
					</AreaChart>
				</ChartContainer>
			</div>
		</div>
	);
}
