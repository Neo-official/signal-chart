"use client"
import { useEffect, useRef, useState } from "react";
import { Button, Card, CardBody, CardFooter, CardHeader, Divider, Input, Slider } from "@nextui-org/react";

function sendJson(socket: WebSocket | null, type: string, data: any) {
	if (socket?.readyState === WebSocket.OPEN)
		socket.send(JSON.stringify({type, data}))
}

function parseMessage(message: string) {
	try {
		return JSON.parse(message)
	}
	catch (e) {
		return {}
	}
}

export default function Page() {
	const [ws, setWs] = useState<WebSocket | null>(null)
	const [connected, setConnected] = useState(false)
	const settingsRef = useRef({
		v_out   : 100,
		dataSize: 10,
		timeStep: 1000,
		pause   : true,
	} as const)
	let settings = settingsRef.current
	const [update, setUpdate] = useState(true);
	// const [dataSize, setDataSize] = useState(10);
	const addDataRef = useRef<HTMLInputElement | null>(null);
	// const setDataSizeRef = useRef<HTMLInputElement>(null);
	const timeStepRef = useRef({value: 1000});

	useEffect(() => {
		// Create WebSocket connection
		const websocket = new WebSocket('ws://localhost:3000') as WebSocket


		websocket.onopen = () => {
			console.log('WebSocket Connected')
			setConnected(true)
		}
		websocket.onmessage = (message) => {
			const {type, data} = parseMessage(message.data)
			switch (type) {
				case 'device:V-out':
					settingsRef.current.v_out = data
					setUpdate(x => !x)
					console.log({data})
					break
			}
		}

		websocket.onclose = () => {
			console.log('WebSocket Disconnected')
			setConnected(false)

			// Optional: Implement reconnection logic
			setTimeout(() => {
				console.log('Attempting to reconnect...')
				setWs(new WebSocket('ws://localhost:3000') as WebSocket)
			}, 5000)
		}

		websocket.onerror = (error) => {
			console.error('WebSocket Error:', error)
		}

		setWs(websocket)
		////////////
		let internalID = -1
		let s = Math.random() * settings.v_out
		loop()

		function loop() {
			setTimeout(() => loop(), settings.timeStep || 1000)
			if (settings.pause) return
			// s += Math.random() * settings.scale * (Math.random() < 0.9 ? 1 : -20 * Math.random())
			s = Math.random() * settings.v_out
			const number = Math.max(0, Math.floor(s))
			s = number;
			const t = Math.floor(Math.random() * 10)
			// socket?.emit('data:add', [number, t] as any);
			const data = [number, t]
			// console.log(data)
			sendJson(websocket, 'device:data:add', data)
		}

		//////////

		return () => {
			// socket?.off('device:V-out');
			// socket?.off('user');
			if (websocket)
				websocket.close()

			if (!settings.pause)
				autoAddOff()
			if (internalID != -1)
				clearInterval(internalID)
		}
	}, [])

	useEffect(() => {
		// console.log('up: ', settings)
		settings = settingsRef.current
	}, [update])

	function addData() {
		setUpdate(x => !x)
		const number = addDataRef.current?.valueAsNumber || Math.random() * settings.v_out
		const t = Math.floor(Math.random() * 10)
		// socket?.emit('data:add', [number, t] as any);
		sendJson(ws, 'device:data:add', [number, t])
	}

	// function changeDataSize() {
	// 	setUpdate(x => !x)
	// 	const number = setDataSizeRef.current?.valueAsNumber || 10
	// 	settingsRef.current.dataSize = number
	// 	socket?.emit('data-size:change', number);
	// }


	function autoAddOn() {
		if (!settings.pause) return
		settingsRef.current.pause = false
		setUpdate(x => !x)
	}

	function autoAddOff() {
		settingsRef.current.pause = true
		setUpdate(x => !x)
	}

	return (
		<section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
			<Card className="border-none w-full h-auto col-span-12 p-1 sm:col-span-5">
				<CardHeader className="flex-col !items-start">
					<h4 className="text-white-500 font-medium text-large">Router simulator</h4>
				</CardHeader>
				<CardBody className="overflow-visible py-2">
					<div className="p-1 pb-2">
						<div className={`mb-4 p-2 rounded ${connected ? 'bg-green-600' : 'bg-red-600'}`}>
							Status: {connected ? 'Connected' : 'Disconnected'}
						</div>
						<h4 className="text-white-500 font-medium text-gl">V-out: {settings.v_out}</h4>
						<h4 className="text-white-500 font-medium text-gl">Data Size: {settings.dataSize}</h4>
						<h4 className="text-white-500 font-medium text-gl">Pause: {settings.pause ? 'true' : 'false'}</h4>
					</div>
					<Divider/>
					<Input
						className="py-2"
						ref={addDataRef}
						type="number"
						label="Data"
						// defaultValue={Math.random() * scale}
						// placeholder='Enter Data ...'
						endContent={<Button color="primary" onPress={addData}>Add</Button>}
					/>
					{/*<Input*/}
					{/*	className="py-2"*/}
					{/*	ref={setDataSizeRef}*/}
					{/*	type="number"*/}
					{/*	label="Data Size"*/}
					{/*	// defaultValue={settings.dataSize}*/}
					{/*	endContent={<Button color="primary" onClick={changeDataSize}>Change</Button>}*/}
					{/*/>*/}
					<Slider
						label="Time Step (ms)"
						step={10}
						maxValue={10000}
						minValue={10}
						defaultValue={timeStepRef.current.value}
						className="max-w-md py-2 w-full"
						onChange={(value: number) => {
							settingsRef.current.timeStep = value as number
						}}
					/>
				</CardBody>
				<CardFooter>
					<div className="justify-between flex flex-grow gap-2 items-center">
						<span className="text-default-500">Auto add data</span>
						<div className="flex gap-2">
							<Button onPress={autoAddOff}>off</Button>
							<Button color="primary" onPress={autoAddOn}>on</Button>
						</div>
					</div>
				</CardFooter>
			</Card>
		</section>
	)
}