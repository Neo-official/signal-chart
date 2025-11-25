import { getActiveDevices } from "./actions";
import { DeviceList } from "@/components/device-list";

export default async function Home() {
	const result = await getActiveDevices();
	const initialDevices = result.success ? result?.data : [];

	return (
		<main>
			<section className="flex flex-col items-center justify-center gap-6 py-8 md:py-10">
				<div className="flex justify-between items-center w-full">
					<div>
						<h2 className="text-3xl font-bold tracking-tight">Active Devices</h2>
						<p className="text-muted-foreground mt-1">Real-time monitoring dashboard</p>
					</div>
				</div>
				<DeviceList initialDevices={initialDevices} />
			</section>
		</main>
	);
}
