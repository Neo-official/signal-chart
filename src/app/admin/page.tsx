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
	const socket = useSocket('/admin');
	const {v_out, state, data, labels} = device;
	const scaleRef = useRef<HTMLInputElement | null>(null);

	function changeScale() {
		const v_out = scaleRef.current?.valueAsNumber ?? 0;
		device.v_out = v_out;
		console.log("V-out: ", v_out);
		socket?.emit('device:V-out', device as any);
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
					label="V-out"
					defaultValue={`${v_out}`}
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

type PropSettings = {
	SettingsRef: React.RefObject<Settings>
	onSubmit: () => void
}

function Settings({SettingsRef, onSubmit}: PropSettings) {
	const [update, setUpdate] = useState(false);

	function changeMaxDataPoints(event: React.ChangeEvent<HTMLInputElement>) {
		let maxDataPoints = Number(event.target.value ?? 0);
		maxDataPoints = Math.max(0, Math.min(maxDataPoints, 2 ** 32 - 1));
		SettingsRef.current.maxDataPoints = maxDataPoints;
		// if (maxDataPointsRef.current)
		// 	maxDataPointsRef.current.value = maxDataPoints as string;
	}

	function changeMaxDataSend(event: React.ChangeEvent<HTMLInputElement>) {
		let maxDataSend = Number(event.target.value ?? 0);
		maxDataSend = Math.max(0, Math.min(maxDataSend, 2 ** 32 - 1));
		SettingsRef.current.maxDataSend = maxDataSend;
		// if (maxDataSendRef.current)
		// 	maxDataSendRef.current.value = maxDataSend as string;
	}

	useEffect(() => {

	}, [update])

	return (
		<Card className="border-none w-full h-auto col-span-12 sm:col-span-5">
			<CardHeader className="justify-between">
				<div className="flex gap-3">
					<div className="flex flex-col gap-1 items-start justify-center">
						<h4 className="text-large font-semibold leading-none text-default-600">Settings</h4>
					</div>
				</div>
			</CardHeader>
			<CardBody className="overflow-visible p-3 py-4">
				<div>
					<Input
						type="number"
						min={0}
						max={4294967295}
						label={`Max Data Storage (${SettingsRef.current.maxDataPoints} bytes)`}
						placeholder={`current is (${SettingsRef.current.maxDataPoints})`}
						description="Maximum Value is 4294967295 (4 GB) for each Device"
						onChange={changeMaxDataPoints}
					/>
					<Input
						type="number"
						min={0}
						label={`Max Data Length (${SettingsRef.current.maxDataSend} points)`}
						placeholder={`current is (${SettingsRef.current.maxDataSend})`}
						description="0 = Receive all of data, default = 300 (5 minutes)"
						onChange={changeMaxDataSend}
					/>
				</div>
			</CardBody>
			<CardFooter
				className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-4 before:rounded-xl rounded-large w-[calc(100%_-_8px)] shadow-small ml-1">
				<Button color="primary" onPress={() => {
					setUpdate(!update);
					onSubmit?.();
				}}>Apply Settings</Button>
			</CardFooter>
		</Card>
	)
}

function Dashboard() {
	const socket = useSocket('/admin');
	const [mounted, setMounted] = useState<boolean>(false)
	const [devices, setDevices] = useState<DeviceType[]>([]);
	const SettingsRef = useRef<Settings>({maxDataPoints: 0, maxDataSend: 0});

	// const settings = SettingsRef.current;

	function submitSettings() {
		socket?.emit('settings', SettingsRef.current as any);
	}


	useEffect(() => {
		setMounted(() => true)
		if (!(socket && mounted)) return;

		socket.emit('_connect');

		socket.on('settings', (data) => {
			console.log('admin:settings:', data);
			// setDevices(Object.values(data?.devices ?? {}));
			SettingsRef.current = data;
			// if (maxDataPointsRef.current)
			// 	maxDataPointsRef.current.value = data.maxDataPoints;
			// console.log(maxDataPointsRef.current, SettingsRef.current.maxDataPoints)
			//
			// if (maxDataSendRef.current)
			// 	maxDataSendRef.current.value = data.maxDataSend;

		});

		socket.on('devices', (data) => {
			// console.log('admin:devices:', data);
			setDevices(data);
		});

		return () => {
			socket.off('settings');
			socket.off('devices');
		};
	}, [socket, mounted])

	if (!mounted)
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
			</div>
		);

	return (
		<div className="max-w-xl2 w-full">
			<Settings SettingsRef={SettingsRef} onSubmit={submitSettings}/>
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
	// noinspection JSUnusedLocalSymbols
	const [isAuthorized, setIsAuthorized] = useState(true);

	useEffect(() => {
		// if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
		// 	const token = localStorage.getItem('authToken');
		// 	setIsAuthorized(!!token)
		// }
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
