"use client"
import { useSocket } from "@/hooks/useSocket";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, ButtonGroup, Card, CardBody, CardFooter, CardHeader, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import Login from "@/components/Login";
import LineChart from "@/components/linechart";
import { DeviceType, Settings } from "@/types";
import * as XLSX from 'xlsx';

const states = ['ban', 'pending', 'active'] as const
const statesColors = {
	'ban'    : 'danger',
	'pending': 'warning',
	'active' : 'success',
} as const
type DeviceProps = {
	device: DeviceType
}

function exportCsv(device: DeviceType) {
	const a = document.createElement('a');
	// id,time,v_out,amp
	// {i},{label},{data[0]},{data[1]}
	const labels = ['id', 'time', 'Vo', 'Io'];
	const data = device.data.map((data, i) => [i, device.labels[i], data[0], data[1]].join(','));
	const csvContent = [labels.join(','), ...data].join('\n');
	a.href = `data:text/csv;charset=utf-8,${csvContent}`;
	a.download = `device-${device.id}-${device.socketId}.csv`;
	a.click();
}

function exportJson(device: DeviceType) {
	const a = document.createElement('a');
	const jsonContent = JSON.stringify(device);
	a.href = `data:text/json;charset=utf-8,${jsonContent}`;
	a.download = `device-${device.id}-${device.socketId}.json`;
	a.click();
}

async function exportExcel(device: DeviceType) {
	try {
		// Create workbook
		const wb = XLSX.utils.book_new();

		const labels = ['id', 'time', 'Vo', 'Io'];
		const data = device.data.map((data, i) => [i, device.labels[i], data[0], data[1]]);

		// Create data array
		const excelData = [labels, ...data];

		// Create worksheet
		const ws = XLSX.utils.aoa_to_sheet(excelData);

		// Add worksheet to workbook
		XLSX.utils.book_append_sheet(wb, ws, 'Device Data');

		// Generate Excel file
		XLSX.writeFile(wb, `device_${device.id}_${device.socketId}.xlsx`);
	}
	catch (error) {
		console.error('Error exporting Excel:', error);
		throw new Error('Failed to export Excel file');
	}
}

type ConfirmProps = {
	onConfirm: () => void
	onCancel: () => void
	message: string
	children: React.ReactNode
}

function Confirm({onConfirm, onCancel, message, children}: ConfirmProps) {
	const {isOpen, onOpen, onOpenChange} = useDisclosure();

	const handleConfirm = useCallback(() => {
		onConfirm();
		onCancel();
	}, [onConfirm, onCancel]);

	return (
		<>
			<Button
				onPress={onOpen}
				color="danger"
				variant="flat"
			>
				{children}
			</Button>

			<Modal
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				closeButton
			>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								Confirm
							</ModalHeader>

							<ModalBody>
								<p>{message}</p>
							</ModalBody>

							<ModalFooter>
								<Button
									color="primary"
									variant="light"
									onPress={() => {
										onClose();
									}}
								>
									No
								</Button>
								<Button
									color="danger"
									variant="solid"
									onPress={() => {
										handleConfirm();
										onClose();
									}}
									autoFocus
								>
									Yes
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
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
			<CardHeader className="justify-between flex-wrap">
				<div className="flex gap-3 m-1 p-1">
					<div className="flex flex-col gap-1 items-start justify-center">
						<h4 className="text-large font-semibold leading-none text-default-600">Device: {device.id}</h4>
						<h5 className={`text-small tracking-tight ${state === 'active' ? 'text-success-500' : state === 'pending' ? 'text-warning-500' : 'text-danger-500'}`}>{state}</h5>
					</div>
				</div>
				{/* action section (select state, export (csv, json, excel, delete modal*/}
				<div className="flex flex-col gap-1 items-start justify-center border-1 border-default-300 p-4 m-1 rounded-lg relative">
					<span className="absolute top-0 translate-y-[-50%] bg-content1 px-1">Actions</span>
					<div className="flex gap-1 items-center justify-center">
						{/*select state*/}
						<ButtonGroup
							variant="flat"
							className="gap-1 border-1 border-default-300 p-1 px-3 rounded-lg"
							aria-label="State selection"
						>
							State:
							{states.map((stateOption) => (
								<Button
									key={stateOption}
									color={statesColors[stateOption]}
									variant={state === stateOption ? "flat" : "light"}
									onPress={() => changeState(stateOption)}
								>
									{stateOption}
								</Button>
							))}
						</ButtonGroup>
						{/*export dropDown (Download as CSV,Download as Excel,Download as JSON)*/}
						<Dropdown>
							<DropdownTrigger>
								<Button variant="flat" color="primary" className="capitalize">
									Export
								</Button>
							</DropdownTrigger>
							<DropdownMenu aria-label="Export Actions">
								<DropdownItem key="csv" onPress={() => exportCsv(device)}>Download as CSV</DropdownItem>
								<DropdownItem key="excel" onPress={() => exportExcel(device)}>Download as
									Excel</DropdownItem>
								<DropdownItem key="json" onPress={() => exportJson(device)}>Download as
									JSON</DropdownItem>
							</DropdownMenu>
						</Dropdown>
						{/*delete*/}
						<Confirm
							onConfirm={() => socket?.emit('device:delete', device.socketId as any)}
							onCancel={() => console.log('Cancelled')}
							message="Are you sure you want to delete this device?"
						>
							Delete
						</Confirm>
					</div>
				</div>


				{/*<div className="flex flex-col gap-1 items-start justify-center">*/}
				{/*	<Button color="primary" onPress={() => exportCsv(device)}>*/}
				{/*		Export CSV*/}
				{/*	</Button>*/}
				{/*</div>*/}


				{/*	state select*/}
				{/*<RadioGroup*/}
				{/*	label="State"*/}
				{/*	size={"sm"}*/}
				{/*	orientation="horizontal"*/}
				{/*	defaultValue={state}*/}
				{/*	onValueChange={changeState}>*/}
				{/*	{states.map((s, key) => (*/}
				{/*		<Radio key={key} value={s} color={statesColors[s]}>*/}
				{/*			<span className={state === s ? `text-${statesColors[s]}-500` : ''}>{s}</span>*/}
				{/*		</Radio>*/}
				{/*	))}*/}
				{/*</RadioGroup>*/}
				{/*/!*	delete button*!/*/}
				{/*<div className="flex flex-col gap-1 items-start justify-center">*/}
				{/*	<Button color="danger" onPress={() => {*/}
				{/*		socket?.emit('device:delete', device.socketId as any);*/}
				{/*	}}>*/}
				{/*		Delete*/}
				{/*	</Button>*/}
				{/*</div>*/}
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
