import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
	size?: number;
};

export type Settings = {
	maxDataPoints: number
	maxDataSend: number
	onlineTimeout?: number
	idleTimeout?: number
	defaultTimeRange?: number
}

export type DeviceType = {
	id: string
	socketId: string
	status: 'online' | 'offline' | 'idle'
	state: 'ban' | 'pending' | 'active'
	v_out: number
	data: [number, number][]
	labels: string[]
};