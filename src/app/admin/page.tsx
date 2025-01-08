"use client"
import { useSocket } from "@/hooks/useSocket";
import React, { useEffect, useRef, useState } from "react";
import { Button, Card, CardBody, CardFooter, CardHeader, Input, Radio, RadioGroup } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import Login from "@/components/Login";
import LineChart from "@/components/linechart";
import { DeviceType, Settings } from "@/types";

const states = ['ban', 'pending', 'active'] as const
type DeviceProps = {
	device: DeviceType
}

function Device({device}: DeviceProps) {
	const socket = useSocket();
	const {scale, state, data, labels} = device;
	const scaleRef = useRef<HTMLInputElement | null>(null);

	function changeScale() {
		const scale = scaleRef.current?.valueAsNumber ?? 0;
		device.scale = scale;
		console.log("scale: ", scale);
		socket?.emit('device:scale', device as any);
	}

	function changeState(value: string) {
		const state = value as typeof states[number];
		device.state = state;
		console.log("state: ", state);
		socket?.emit('device:state', device as any);
	}

	return (
		<Card className="border-none w-full h-auto col-span-12 sm:col-span-5">
			<CardHeader className="justify-between">
				<div className="flex gap-3">
					<div className="flex flex-col gap-1 items-start justify-center">
						<h4 className="text-large font-semibold leading-none text-default-600">Device: {device.id}</h4>
						<h5 className="text-small tracking-tight text-default-400">{state}</h5>
					</div>
				</div>
				<RadioGroup
					label="State"
					size={"sm"}
					orientation="horizontal"
					defaultValue={state}
					onValueChange={changeState}>
					{states.map((s, key) => (
						<Radio key={key} value={s}>{s}</Radio>
					))}
				</RadioGroup>
			</CardHeader>
			<CardBody className="overflow-visible p-3 py-4">
				<div>
					<LineChart
						title={"Chart"}
						label={"dataset: " + device.id}
						labels={labels.map(t => new Date(t).toISOString())}
						data={data}
						// backgroundColor="rgb(255, 99, 132)"
						// borderColor="rgb(255, 99, 132)"
						// borderWidth={1}
						// fill={false}
					/>
				</div>
			</CardBody>
			<CardFooter
				className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-4 before:rounded-xl rounded-large w-[calc(100%_-_8px)] shadow-small ml-1">
				<Input
					ref={scaleRef}
					type="number"
					label="Scale"
					defaultValue={`${scale}`}
					endContent={
						<Button color="primary" onPress={changeScale}>
							Change
						</Button>
					}
				/>
			</CardFooter>
		</Card>
	)
}

function Dashboard() {
	const socket = useSocket();
	const [mounted, setMounted] = useState<boolean>(false)
	const [devices, setDevices] = useState<DeviceType[]>([]);
	const SettingsRef = useRef<Settings>({maxDataPoints: 0});
	const maxDataPointsRef = useRef<HTMLInputElement | null>(null);

	function changeMaxDataPoints(event: React.ChangeEvent<HTMLInputElement>) {
		let maxDataPoints = Number(event.target.value ?? 0);
		maxDataPoints = Math.max(0, Math.min(maxDataPoints, 2 ** 32 - 1));
		SettingsRef.current.maxDataPoints = maxDataPoints;
		// if (maxDataPointsRef.current)
		// 	maxDataPointsRef.current.value = maxDataPoints as string;
	}

	function submitMaxDataPoints() {
		socket?.emit('admin:settings', SettingsRef.current as any);
	}


	useEffect(() => {
		setMounted(() => true)
		if (!socket) return;

		socket.emit('_connect');

		socket.on('admin:settings', (data) => {
			// console.log('admin:settings:', data);
			// setDevices(Object.values(data?.devices ?? {}));
			SettingsRef.current = data;
			// if (maxDataPointsRef.current)
			// 	maxDataPointsRef.current.value = SettingsRef.current.maxDataPoints as string;
			// console.log(maxDataPointsRef.current.value, SettingsRef.current.maxDataPoints)

		});

		socket.on('admin:devices', (data) => {
			// console.log('admin:devices:', data);
			setDevices(data);
		});

		return () => {
			socket.off('admin:settings');
			socket.off('admin:devices');
		};
	}, [socket, mounted])

	return (
		<div className="max-w-xl2 w-full">
			<span className="text-large">Settings</span>
			<div className="mt-4">
				<Input
					ref={maxDataPointsRef}
					type="number"
					label="Max Data Size (bytes)"
					description="Maximum Value is 4294967295 (4 GB) for each Device"
					value={`${SettingsRef.current.maxDataPoints}`}
					onChange={changeMaxDataPoints}
					endContent={
						<Button color="primary" onPress={submitMaxDataPoints}>
							Change
						</Button>
					}/>
			</div>
			<br/>
			<div className="flex flex-col gap-4 justify-between items-center w-full">
				<div className="flex justify-between items-center w-full">
					<span className="text-large">Devices</span>
					<Button color="primary" onPress={() => socket?.emit('admin:devices')}>
						Refresh
					</Button>
				</div>
				{devices.map((device, index) => (
					<Device device={device} key={index}/>
				))}
			</div>
		</div>
	)
}

export default function AdminPage() {
	const router = useRouter();
	const [isAuthorized, setIsAuthorized] = useState(false);

	useEffect(() => {
		if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
			const token = localStorage.getItem('authToken');
			setIsAuthorized(!!token)
		}
	}, [router]);

	return (
		<>
			<section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
				{isAuthorized ?
					<Dashboard/> :
					<Login/>}
			</section>
		</>
	);
}
