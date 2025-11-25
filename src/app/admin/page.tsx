"use client"
import { useSocket } from "@/hooks/useSocket";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChartComponent } from "@/components/chart-component";
import Login from "@/components/Login";
import { DeviceType, Settings } from "@/types";
import { client } from "@/lib/api-client";
import { SocketMessage } from "@/types/socket";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { checkTokenIsExpiredClient } from "@/lib/validators";
import { Download, Trash2, ChevronLeft, ChevronRight, Cpu, Settings as SettingsIcon, Filter, KeyRound, RefreshCw, Save, Ban, Clock, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const states = ['ban', 'pending', 'active'] as const;
const statesLabels = {
	'ban'    : 'Banned',
	'pending': 'Pending',
	'active' : 'Active',
} as const;
const stateStyles = {
	active : 'bg-green-500 text-white',
	pending: 'bg-yellow-500 text-white',
	ban    : 'bg-red-500 text-white',
} as const;
const statusStyles = {
	online : 'bg-green-500 text-white',
	idle   : 'bg-yellow-500 text-white',
	offline: 'bg-gray-500 text-white',
} as const;
const statesIcons = {
	'ban'    : <Ban className="w-4 h-4"/>,
	'pending': <Clock className="w-4 h-4"/>,
	'active' : <CheckCircle className="w-4 h-4"/>,
} as const;

function exportCsv(device: DeviceType) {
	const labels = ['id', 'time', 'Vo', 'Io'];
	const data = device.data.map((data, i) => [i, device.labels[i], data[0], data[1]].join(','));
	const csvContent = [labels.join(','), ...data].join('\n');
	const a = document.createElement('a');
	a.href = `data:text/csv;charset=utf-8,${csvContent}`;
	a.download = `device-${device.id}-${device.socketId}.csv`;
	a.click();
}

function exportJson(device: DeviceType) {
	const a = document.createElement('a');
	a.href = `data:text/json;charset=utf-8,${JSON.stringify(device)}`;
	a.download = `device-${device.id}-${device.socketId}.json`;
	a.click();
}

function exportExcel(device: DeviceType) {
	const wb = XLSX.utils.book_new();
	const labels = ['id', 'time', 'Vo', 'Io'];
	const data = device.data.map((data, i) => [i, device.labels[i], data[0], data[1]]);
	const ws = XLSX.utils.aoa_to_sheet([labels, ...data]);
	XLSX.utils.book_append_sheet(wb, ws, 'Device Data');
	XLSX.writeFile(wb, `device_${device.id}_${device.socketId}.xlsx`);
}

function Device({device}: { device: DeviceType }) {
	const socket = useSocket('admin');
	const [vOut, setVOut] = useState(device.v_out);
	const [open, setOpen] = useState(false);
	const [isExporting, setIsExporting] = useState(false);

	const changeState = (state: string) => {
		socket?.emit('action', {
			resource: 'device',
			action  : 'update',
			socketId: device.socketId,
			key     : 'state',
			value   : state,
		} as any);
		toast.success(`Device ${device.id} state changed to ${state}`);
	};

	const changeVOut = () => {
		socket?.emit('action', {
			resource: 'device',
			action  : 'update',
			socketId: device.socketId,
			key     : 'vOut',
			value   : vOut,
		} as any);
		toast.success(`Device ${device.id} V-out set to ${vOut}`);
	};

	const deleteDevice = () => {
		socket?.emit('action', {resource: 'device', action: 'delete', socketId: device.socketId} as any);
		toast.success(`Device ${device.id} deleted`);
		setOpen(false);
	};


	return (
		<Card className="w-full">
			<CardHeader className="pb-4">
				<div className="flex justify-between items-start gap-4">
					<div className="flex-1">
						<div className="flex items-center gap-3 mb-2">
							<CardTitle className="text-xl text-foreground">Device {device.id}</CardTitle>
							<span
								className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${stateStyles[device.state as keyof typeof stateStyles]}`}>
								<span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
								{device.state}
							</span>
							<span
								className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[device.status as keyof typeof statusStyles]}`}>
								<span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
								{device.status}
							</span>
						</div>
						<p className="text-sm text-muted-foreground">
							Socket: <code
							className="text-xs bg-muted px-1 py-0.5 rounded">{device.socketId}</code> • {device.data?.length || 0} data
							points
						</p>
					</div>
					<div className="flex items-center gap-2">
						<ButtonGroup>
							{states.map((state) => (
								<Button
									key={state}
									size="sm"
									variant={device.state === state ? "default" : "outline"}
									onClick={() => changeState(state)}
									className={`${device.state === state ? stateStyles[state] : ''} border-border`}
									title={statesLabels[state as keyof typeof statesLabels]}
								>
									{statesIcons[state as keyof typeof statesIcons]}
									{statesLabels[state as keyof typeof statesLabels]}
								</Button>
							))}
						</ButtonGroup>
						<Dialog open={open} onOpenChange={setOpen}>
							<DialogTrigger asChild>
								<Button variant="destructive" size="sm" title="Delete device">
									<Trash2 className="w-4 h-4"/>
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Delete Device</DialogTitle>
									<DialogDescription>
										Are you sure you want to delete this device? This action cannot be undone.
									</DialogDescription>
								</DialogHeader>
								<DialogFooter>
									<Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
									<Button variant="destructive" onClick={deleteDevice}>Delete</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<ChartComponent title="Device Data" data={device.data} labels={device.labels}/>
			</CardContent>
			<CardFooter className="flex justify-between items-center">
				<div className="flex items-center gap-3">
					<Label htmlFor={`vout-${device.id}`} className="text-sm font-medium">V-out:</Label>
					<Input
						id={`vout-${device.id}`}
						type="number"
						value={vOut}
						onChange={(e) => setVOut(Number(e.target.value))}
						className="w-24"
					/>
					<Button onClick={changeVOut} size="sm">
						<Save className="w-3.5 h-3.5 mr-1"/>
						Apply
					</Button>
				</div>
				<ButtonGroup>
					<Button variant="outline" size="sm" onClick={() => {
						setIsExporting(true);
						exportCsv(device);
						setTimeout(() => setIsExporting(false), 500);
					}} disabled={isExporting}>
						<Download className="w-4 h-4 mr-1"/> CSV
					</Button>
					<Button variant="outline" size="sm" onClick={() => {
						setIsExporting(true);
						exportExcel(device);
						setTimeout(() => setIsExporting(false), 500);
					}} disabled={isExporting}>
						<Download className="w-4 h-4 mr-1"/> Excel
					</Button>
					<Button variant="outline" size="sm" onClick={() => {
						setIsExporting(true);
						exportJson(device);
						setTimeout(() => setIsExporting(false), 500);
					}} disabled={isExporting}>
						<Download className="w-4 h-4 mr-1"/> JSON
					</Button>
				</ButtonGroup>
			</CardFooter>
		</Card>
	);
}

function SettingsCard({settingsRef, onSubmit}: { settingsRef: React.RefObject<Settings>, onSubmit: () => void }) {
	const [maxDataPoints, setMaxDataPoints] = useState(settingsRef.current?.maxDataPoints || 0);
	const [maxDataSend, setMaxDataSend] = useState(settingsRef.current?.maxDataSend || 0);
	const [onlineTimeout, setOnlineTimeout] = useState(settingsRef.current?.onlineTimeout || 10000);
	const [idleTimeout, setIdleTimeout] = useState(settingsRef.current?.idleTimeout || 30000);
	const [defaultTimeRange, setDefaultTimeRange] = useState(settingsRef.current?.defaultTimeRange || 300);
	const [isSaving, setIsSaving] = useState(false);

	const handleSubmit = () => {
		setIsSaving(true);
		if (settingsRef.current) {
			settingsRef.current.maxDataPoints = maxDataPoints;
			settingsRef.current.maxDataSend = maxDataSend;
			settingsRef.current.onlineTimeout = onlineTimeout;
			settingsRef.current.idleTimeout = idleTimeout;
			settingsRef.current.defaultTimeRange = defaultTimeRange;
		}
		onSubmit();
		toast.success('Settings updated successfully');
		setTimeout(() => setIsSaving(false), 500);
	};

	return (
		<div className="space-y-6">
			<Card className="border-border">
				<CardHeader className="pb-3">
					<CardTitle className="text-xl">Data Settings</CardTitle>
					<p className="text-sm text-muted-foreground mt-1">Configure data storage and transmission limits</p>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="maxDataPoints" className="text-sm font-medium">Max Data Points</Label>
							<Input
								id="maxDataPoints"
								type="number"
								value={maxDataPoints}
								onChange={(e) => setMaxDataPoints(Number(e.target.value))}
							/>
							<p className="text-xs text-muted-foreground">{maxDataPoints.toLocaleString()} points</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="maxDataSend" className="text-sm font-medium">Max Data Send</Label>
							<Input
								id="maxDataSend"
								type="number"
								value={maxDataSend}
								onChange={(e) => setMaxDataSend(Number(e.target.value))}
							/>
							<p className="text-xs text-muted-foreground">{maxDataSend.toLocaleString()} points</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="defaultTimeRange" className="text-sm font-medium">Default Time Range</Label>
							<Input
								id="defaultTimeRange"
								type="number"
								value={defaultTimeRange}
								onChange={(e) => setDefaultTimeRange(Number(e.target.value))}
							/>
							<p className="text-xs text-muted-foreground">{defaultTimeRange}s</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="border-border">
				<CardHeader className="pb-3">
					<CardTitle className="text-xl">Device Status Timeouts</CardTitle>
					<p className="text-sm text-muted-foreground mt-1">Configure when devices transition between online,
						idle, and offline states</p>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="onlineTimeout" className="text-sm font-medium">Online Timeout</Label>
							<Input
								id="onlineTimeout"
								type="number"
								value={onlineTimeout}
								onChange={(e) => setOnlineTimeout(Number(e.target.value))}
							/>
							<p className="text-xs text-muted-foreground">Device becomes idle after {onlineTimeout}ms of
								inactivity</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="idleTimeout" className="text-sm font-medium">Idle Timeout</Label>
							<Input
								id="idleTimeout"
								type="number"
								value={idleTimeout}
								onChange={(e) => setIdleTimeout(Number(e.target.value))}
							/>
							<p className="text-xs text-muted-foreground">Device becomes offline after {idleTimeout}ms of
								inactivity</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="flex justify-end">
				<Button onClick={handleSubmit} size="lg" disabled={isSaving}>
					<Save className="w-4 h-4 mr-2"/>
					{isSaving ? 'Saving...' : 'Apply All Settings'}
				</Button>
			</div>
		</div>
	);
}

function Dashboard() {
	const socket = useSocket('admin');
	const [devices, setDevices] = useState<DeviceType[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [devicesPerPage, setDevicesPerPage] = useState(5);
	const [activeTab, setActiveTab] = useState<'devices' | 'settings' | 'account'>('devices');
	const [filterState, setFilterState] = useState<string>('all');
	const [filterStatus, setFilterStatus] = useState<string>('all');
	const [isLoading, setIsLoading] = useState(true);
	const settingsRef = useRef<Settings>({maxDataPoints: 0, maxDataSend: 0});

	const filteredDevices = devices.filter(d => {
		const stateMatch = filterState === 'all' || d.state === filterState;
		const statusMatch = filterStatus === 'all' || d.status === filterStatus;
		return stateMatch && statusMatch;
	});

	const totalPages = devicesPerPage === -1 ? 1 : Math.ceil(filteredDevices.length / devicesPerPage);
	const startIndex = (currentPage - 1) * devicesPerPage;
	const paginatedDevices = devicesPerPage === -1 ? filteredDevices : filteredDevices.slice(startIndex, startIndex + devicesPerPage);

	// Fetch initial data from REST API
	useEffect(() => {
		Promise.all([
			client.devices.getAll(),
			client.settings.get(),
		]).then(([devices, settings]) => {
			setDevices(devices);
			settingsRef.current = settings;
		}).catch(console.error)
		.finally(() => setIsLoading(false));
	}, []);

	// Listen for real-time updates via Socket.IO
	useEffect(() => {
		if (!socket) return;

		socket.on('action', (msg: SocketMessage) => {
			switch (msg.resource) {
				case 'device':
					switch (msg.action) {
						case 'create':
							setDevices(prev => {
								const exists = prev.find(d => d.socketId === msg.value?.socketId);
								if (!exists) {
									toast.info(`Device ${msg.value?.id} connected`);
								}
								return exists ? prev : [...prev, msg.value];
							});
							break;

						case 'update':
							if (msg.key === 'data') {
								setDevices(prev => prev.map(d =>
									d.socketId === msg.socketId
										? {
											...d,
											data  : [...d.data, [msg.value[0], msg.value[1]]],
											labels: [...d.labels, new Date(msg.value[2]).toLocaleTimeString()],
										}
										: d,
								));
							}
							else if (msg.key === 'state') {
								setDevices(prev => prev.map(d => d.socketId === msg.socketId ? {
									...d,
									state: msg.value,
								} : d));
							}
							else if (msg.key === 'status') {
								const device = devices.find(d => d.socketId === msg.socketId);
								if (device && device.status !== msg.value) {
									toast.info(`Device ${device.id} is now ${msg.value}`);
								}
								setDevices(prev => prev.map(d => d.socketId === msg.socketId ? {
									...d,
									status: msg.value,
								} : d));
							}
							break;

						case 'delete':
							const deletedDevice = devices.find(d => d.socketId === msg.socketId);
							if (deletedDevice) {
								toast.info(`Device ${deletedDevice.id} removed`);
							}
							setDevices(prev => prev.filter(d => d.socketId !== msg.socketId));
							break;
					}
					break;

				case 'settings':
					if (msg.action === 'update') {
						settingsRef.current = msg.value;
					}
					break;
			}
		});

		return () => {
			socket.off('action');
		};
	}, [socket]);

	return (
		<div className="w-full max-w-7xl mx-auto space-y-6">
			<div className="space-y-1">
				<h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
				<p className="text-muted-foreground">Monitor and manage all connected devices</p>
			</div>
			<div className="flex justify-between items-center border-b">
				<div className="flex gap-2">
					<Button
						variant={activeTab === 'devices' ? 'default' : 'ghost'}
						onClick={() => setActiveTab('devices')}
						className="rounded-b-none"
					>
						<Cpu className="w-4 h-4 mr-2"/>
						Devices
					</Button>
					<Button
						variant={activeTab === 'settings' ? 'default' : 'ghost'}
						onClick={() => setActiveTab('settings')}
						className="rounded-b-none"
					>
						<SettingsIcon className="w-4 h-4 mr-2"/>
						Settings
					</Button>
					<Button
						variant={activeTab === 'account' ? 'default' : 'ghost'}
						onClick={() => setActiveTab('account')}
						className="rounded-b-none"
					>
						<KeyRound className="w-4 h-4 mr-2"/>
						Account
					</Button>
				</div>

			</div>
			{activeTab === 'settings' && (
				<SettingsCard settingsRef={settingsRef} onSubmit={() => socket?.emit('action', {
					resource: 'settings',
					action  : 'update',
					value   : settingsRef.current,
				} as any)}/>
			)}
			{activeTab === 'account' && (
				<Card className="border-border">
					<CardHeader className="pb-3">
						<CardTitle className="text-xl">Account Settings</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">Update your username and password</p>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Change Username</h3>
							<div className="space-y-2">
								<Label htmlFor="newUsername">New Username</Label>
								<Input id="newUsername" placeholder="Enter new username"/>
							</div>
							<Button>Update Username</Button>
						</div>
						<div className="border-t pt-6 space-y-4">
							<h3 className="text-lg font-semibold">Change Password</h3>
							<div className="space-y-2">
								<Label htmlFor="currentPassword">Current Password</Label>
								<Input id="currentPassword" type="password" placeholder="Enter current password"/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="newPassword">New Password</Label>
								<Input id="newPassword" type="password" placeholder="Enter new password"/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="confirmPassword">Confirm Password</Label>
								<Input id="confirmPassword" type="password" placeholder="Confirm new password"/>
							</div>
							<Button>Update Password</Button>
						</div>
					</CardContent>
				</Card>
			)}
			{activeTab === 'devices' && (
				<>
					<div className="space-y-4 pt-4">
						<div className="flex justify-between items-center">
							<div>
								<h2 className="text-2xl font-bold">Devices</h2>
								<p className="text-sm text-muted-foreground">{filteredDevices.length} of {devices.length} device{devices.length !== 1 ? 's' : ''}</p>
							</div>
							<div className="flex items-center gap-2">
								<Select value={devicesPerPage.toString()} onValueChange={(v) => {
									setDevicesPerPage(Number(v));
									setCurrentPage(1);
								}}>
									<SelectTrigger className="w-[120px]">
										<SelectValue/>
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
									<RefreshCw className="w-4 h-4 mr-2"/>
									Refresh
								</Button>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Filter className="w-4 h-4 text-muted-foreground"/>
							<Select value={filterState} onValueChange={(v) => {
								setFilterState(v);
								setCurrentPage(1);
							}}>
								<SelectTrigger className="w-[140px]">
									<SelectValue placeholder="State"/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All States</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="ban">Banned</SelectItem>
								</SelectContent>
							</Select>
							<Select value={filterStatus} onValueChange={(v) => {
								setFilterStatus(v);
								setCurrentPage(1);
							}}>
								<SelectTrigger className="w-[140px]">
									<SelectValue placeholder="Status"/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="online">Online</SelectItem>
									<SelectItem value="idle">Idle</SelectItem>
									<SelectItem value="offline">Offline</SelectItem>
								</SelectContent>
							</Select>
							{(filterState !== 'all' || filterStatus !== 'all') && (
								<Button variant="ghost" size="sm" onClick={() => {
									setFilterState('all');
									setFilterStatus('all');
									setCurrentPage(1);
								}} title="Clear all filters">
									Clear Filters
								</Button>
							)}
						</div>
					</div>
					<div className="space-y-4">
						{isLoading ? (
							<Card>
								<CardContent className="flex items-center justify-center py-16">
									<RefreshCw className="w-8 h-8 animate-spin text-primary"/>
								</CardContent>
							</Card>
						) : devices.length === 0 ? (
							<Card className="border-dashed border-2">
								<CardContent className="flex flex-col items-center justify-center py-16">
									<div className="rounded-full bg-muted p-4 mb-4">
										<svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor"
											 viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
												  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
										</svg>
									</div>
									<h3 className="text-lg font-semibold mb-1">No Devices Found</h3>
									<p className="text-muted-foreground text-center text-sm">
										Devices will appear here once they connect to the system.
									</p>
								</CardContent>
							</Card>
						) : (
							<>
								{paginatedDevices.map((device) => (
									<Device key={device.socketId || device.id} device={device}/>
								))}
								{devicesPerPage !== -1 && filteredDevices.length > 0 && (
									<div className="flex justify-center items-center gap-1 pt-4">
										<Button
											variant="outline"
											size="icon"
											onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
											disabled={currentPage === 1}
										>
											<ChevronLeft className="w-4 h-4"/>
										</Button>
										{totalPages <= 7 ? (
											Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
												<Button
													key={page}
													variant={currentPage === page ? 'default' : 'outline'}
													size="icon"
													onClick={() => setCurrentPage(page)}
												>
													{page}
												</Button>
											))
										) : (
											<>
												<Button
													variant={currentPage === 1 ? 'default' : 'outline'}
													size="icon"
													onClick={() => setCurrentPage(1)}
												>
													1
												</Button>
												{currentPage > 3 && <span className="px-2">...</span>}
												{currentPage > 2 && currentPage < totalPages - 1 && (
													<>
														{currentPage - 1 > 1 && (
															<Button variant="outline" size="icon"
																	onClick={() => setCurrentPage(currentPage - 1)}>
																{currentPage - 1}
															</Button>
														)}
														<Button variant="default" size="icon">
															{currentPage}
														</Button>
														{currentPage + 1 < totalPages && (
															<Button variant="outline" size="icon"
																	onClick={() => setCurrentPage(currentPage + 1)}>
																{currentPage + 1}
															</Button>
														)}
													</>
												)}
												{currentPage === 2 && (
													<Button variant="default" size="icon">
														2
													</Button>
												)}
												{currentPage < totalPages - 2 && <span className="px-2">...</span>}
												<Button
													variant={currentPage === totalPages ? 'default' : 'outline'}
													size="icon"
													onClick={() => setCurrentPage(totalPages)}
												>
													{totalPages}
												</Button>
											</>
										)}
										<Button
											variant="outline"
											size="icon"
											onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
											disabled={currentPage === totalPages}
										>
											<ChevronRight className="w-4 h-4"/>
										</Button>
									</div>
								)}
							</>
						)}
					</div>
				</>
			)}
		</div>
	);
}

export default function AdminPage() {
	const [isAuthorized, setIsAuthorized] = useState(false);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const token = localStorage.getItem('authToken');
			const check = checkTokenIsExpiredClient(token!, "");
			setIsAuthorized(!check);
		}
	}, []);

	return (
		<section className="flex flex-col items-center justify-center gap-4 py-8">
			{isAuthorized ? <Dashboard/> : <Login/>}
		</section>
	);
}
