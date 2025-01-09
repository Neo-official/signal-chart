"use client"
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
// @ts-ignore
// import CanvasJSReact from '@canvasjs/react-stockcharts';
import { Switch } from "@nextui-org/switch";
import dynamic from "next/dynamic";
import { DeviceType } from "@/types";

const CanvasJSChart = dynamic(
	() => import('@canvasjs/react-stockcharts').then(
		(module) => module.default.CanvasJSStockChart,
	),
	{ssr: false},
);
// const {CanvasJSStockChart: CanvasJSChart} = CanvasJSReact;

type LineChartProps = {
	title: string;
	label: string;
	labels: string[];
	data: DeviceType['data'];
};

const LineChart = ({title = "Real-time Chart", label = "Dataset", labels = [], data = []}: LineChartProps) => {
	const {theme} = useTheme();
	// useState go to current data update
	const [currentData, setCurrentData] = useState<boolean>(false)
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient)
		return null; // or a loading state

	// console.log(theme)
	const options = {
		// animationEnabled: true,
		exportEnabled: true,
		theme        : theme === "light" ? 'light2' : 'dark2',
		title        : {text: title},
		axisX        : {
			title            : "Labels",
			valueFormatString: "MMM DD",
			interval         : 1,
		},
		axisY        : {
			title      : "Values",
			includeZero: true,
		},
		toolTip      : {
			shared: true,
		},
		charts       : [{
			toolTip: {
				shared: true,
			},
			axisX  : {
				crosshair: {
					enabled: true,
				},
			},
			// axisY: {
			// 	// prefix: "",
			// 	// suffix: "",
			// 	// title: "V-out",
			// 	// titleFontSize: 14
			// },
			data: [{
				type              : "splineArea",
				color             : "#3698C5",
				name              : label,
				xValueFormatString: "MMM YYYY",
				yValueFormatString: "### V",
				dataPoints        : labels.map((label, index) => ({
					x: new Date(label), // Assuming labels are date strings
					y: data[index]?.[0],
				})),
			}],
		}, {
			height: 100,
			toolTip: {
				shared: true,
			},
			axisX  : {
				crosshair: {
					enabled: true,
				},
			},
			// axisY: {
			// 	// prefix: "",
			// 	// suffix: "",
			// 	// title: "V-out",
			// 	// titleFontSize: 14
			// },
			data: [{
				type              : "splineArea",
				color             : "#c53657",
				name              : label,
				xValueFormatString: "MMM YYYY",
				yValueFormatString: "### V",
				dataPoints        : labels.map((label, index) => ({
					x: new Date(label), // Assuming labels are date strings
					y: data[index]?.[1],
				})),
			}],
		}],
		navigator    : {
			slider: {
				maximum: currentData ? new Date(labels[labels.length - 1]) : 0,
			},
			// axisX: {
			// 	labelFontColor: "white"
			// }
		},
		rangeSelector: {
			// enabled: false,
			label: "Zoom",
			// verticalAlign: "bottom", // "top"
			buttons    : [
				{
					range    : 1,
					label    : "1Sec",
					rangeType: "second", // “millisecond”, “second”, “minute”, “hour”, “day”, “week”, “month”, “year”, “ytd”, “all”
				},
				{
					range    : 1,
					label    : "1Min",
					rangeType: "minute",
				},
				{
					range    : 1,
					label    : "1Hr",
					rangeType: "hour",
				},
				{
					range    : 1,
					label    : "1Day",
					rangeType: "day",
				},
				{
					range    : 1,
					label    : "1Week",
					rangeType: "week",
				},
				{
					range    : 1,
					label    : "1Month",
					rangeType: "month",
				},
				{
					range    : 1,
					label    : "1Year",
					rangeType: "year",
				},
				{
					range    : 1,
					label    : "All",
					rangeType: "all",
				},
			],
			inputFields: {
				enabled: false,
			},
		},
	};

	// useEffect(() => {
	// 	// console.log({data, labels});
	// }, [currentData]);


	return (
		<>
			<Switch
				className="pb-2 pt-1"
				checked={currentData}
				onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
					setCurrentData(event.target.checked)
				}}
			>
				go to current data
			</Switch>
			{/*{typeof window !== 'undefined' && typeof document !== 'undefined' &&(*/}
			{/*	<CanvasJSChart options={options}/>*/}
			{/*)}*/}
			<CanvasJSChart options={options}/>
		</>
	);
};

export default LineChart;
