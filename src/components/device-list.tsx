"use client"

import { useSocket } from "@/hooks/useSocket";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceType } from "@/types";
import { SocketMessage } from "@/types/socket";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartComponent } from "./chart-component";
import { getActiveDevices } from "@/app/actions";

const STATE_STYLES = {
	active: 'bg-green-500 text-white',
	pending: 'bg-yellow-500 text-white',
	ban: 'bg-red-500 text-white',
} as const;

const STATUS_STYLES = {
	online: 'bg-green-500 text-white',
	idle: 'bg-yellow-500 text-white',
	offline: 'bg-gray-500 text-white',
} as const;

function Device({ device }: { device: DeviceType }) {
	const { data, state, status } = device;

	return (
		<Card className="w-full">
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<CardTitle className="text-xl text-foreground">Device {device.id}</CardTitle>
						<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATE_STYLES[state as keyof typeof STATE_STYLES]}`}>
							<span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
							{state}
						</span>
						<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status as keyof typeof STATUS_STYLES]}`}>
							<span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
							{status}
						</span>
					</div>
				</div>
				<p className="text-sm text-muted-foreground mt-2">
					{data.length} data points recorded
				</p>
			</CardHeader>
			<CardContent>
				<ChartComponent
					title={`Device: ${device.id}`}
					data={device.data}
					labels={device.labels}
				/>
			</CardContent>
		</Card>
	)
}

export function DeviceList({ initialDevices }: { initialDevices: DeviceType[] }) {
	const socket = useSocket('user');
	const [devices, setDevices] = useState<DeviceType[]>(initialDevices);
	const [currentPage, setCurrentPage] = useState(1);
	const [devicesPerPage, setDevicesPerPage] = useState(5);

	const totalPages = devicesPerPage === -1 ? 1 : Math.ceil(devices.length / devicesPerPage);
	const startIndex = (currentPage - 1) * devicesPerPage;
	const paginatedDevices = devicesPerPage === -1 ? devices : devices.slice(startIndex, startIndex + devicesPerPage);

	useEffect(() => {
		if (!socket) return;

		socket.on('action', (msg: SocketMessage) => {
			if (msg.resource === 'device') {
				switch (msg.action) {
					case 'create':
						if (msg.value?.state === 'active') {
							setDevices(prev => {
								const exists = prev.find(d => d.socketId === msg.value.socketId);
								return exists ? prev : [...prev, msg.value];
							});
						}
						break;

					case 'update':
						if (msg.key === 'data') {
							setDevices(prev => prev.map(d =>
								d.socketId === msg.socketId
									? {
										...d,
										data: [...d.data, [msg.value[0], msg.value[1]]],
										labels: [...d.labels, new Date(msg.value[2]).toLocaleTimeString()],
									}
									: d,
							));
						} else if (msg.key === 'state') {
							getActiveDevices().then(result => {
								if (result.success) setDevices(result?.data);
							});
						} else if (msg.key === 'status') {
							setDevices(prev => prev.map(d => d.socketId === msg.socketId ? { ...d, status: msg.value } : d));
						}
						break;

					case 'delete':
						setDevices(prev => prev.filter(d => d.socketId !== msg.socketId));
						break;
				}
			}
		});

		return () => {
			socket.off('action');
		};
	}, [socket]);

	return (
		<>
			<div className="flex items-center gap-2 w-full justify-end">
				<Select value={devicesPerPage.toString()} onValueChange={(v) => {
					setDevicesPerPage(Number(v));
					setCurrentPage(1);
				}}>
					<SelectTrigger className="w-[120px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="5">5 per page</SelectItem>
						<SelectItem value="10">10 per page</SelectItem>
						<SelectItem value="15">15 per page</SelectItem>
						<SelectItem value="25">25 per page</SelectItem>
						<SelectItem value="50">50 per page</SelectItem>
						<SelectItem value="-1">All</SelectItem>
					</SelectContent>
				</Select>
				<Button onClick={() => window.location.reload()} variant="outline">
					<RefreshCw className="w-4 h-4 mr-2" />
					Refresh
				</Button>
			</div>
			<div className="w-full space-y-4">
				{devices.length === 0 ? (
					<Card className="w-full border-dashed border-2">
						<CardContent className="flex flex-col items-center justify-center py-16">
							<div className="rounded-full bg-muted p-4 mb-4">
								<svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
								</svg>
							</div>
							<h3 className="text-lg font-semibold mb-1">No Active Devices</h3>
							<p className="text-muted-foreground text-center text-sm">
								Connect a device to start monitoring data in real-time.
							</p>
						</CardContent>
					</Card>
				) : (
					<>
						{paginatedDevices.map((device) => (
							<Device key={device.socketId || device.id} device={device} />
						))}
					</>
				)}
				{devices.length > 0 && devicesPerPage !== -1 && totalPages > 1 && (
					<div className="flex justify-center items-center gap-2 pt-4">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
							disabled={currentPage === 1}
						>
							<ChevronLeft className="w-4 h-4 mr-1" />
							Previous
						</Button>
						<span className="text-sm text-muted-foreground">
							Page {currentPage} of {totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages}
						>
							Next
							<ChevronRight className="w-4 h-4 ml-1" />
						</Button>
					</div>
				)}
			</div>
		</>
	);
}
