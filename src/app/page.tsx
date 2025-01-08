"use client"
import LineChart from "@/components/linechart";
import { useSocket } from "@/hooks/useSocket";
import { useEffect, useState } from "react";
import { Button, Card, CardBody } from "@nextui-org/react";
import { DeviceType } from "@/types";

type DeviceProps = {
	device: DeviceType
}

function Device({device}: DeviceProps) {
	const {scale, data, labels} = device;
	return (
		<Card className="border-none w-full h-auto col-span-12 sm:col-span-5">
			<CardBody className="overflow-visible p-3 py-4">
				<div>
					<LineChart
						title={"Device: " + device.id}
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
		</Card>
	)
}

export default function Home() {
	const socket = useSocket();
	const [mounted, setMounted] = useState<boolean>(false)
	const [devices, setDevices] = useState<DeviceType[]>([]);

	useEffect(() => {
		setMounted(() => true)
		if (!socket) return; // Add this check

		socket.emit('_connect');

		socket.on('devices', (data) => {
			// console.log('Received data:', data);
			// if (Array.isArray(data))   // Add type check
			setDevices(data);
		});

		// Cleanup
		return () => {
			socket.off('devices');
		};
	}, [socket, mounted]);

	return (
		<>
			<main>
				<section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
					<div className="flex justify-between items-center w-full">
						<span className="text-large">Devices</span>
						<Button color="primary" onClick={() => socket?.emit('devices')}>
							Refresh
						</Button>
					</div>
					{devices.map((device, index) => (
						<Device key={index} device={device}/>
					))}
				</section>
			</main>
		</>
	);
}
