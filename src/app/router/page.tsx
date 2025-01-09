"use client"
import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { Button, Card, CardBody, CardFooter, CardHeader, Divider, Input, Slider } from "@nextui-org/react";

export default function Page() {
	const socket = useSocket();
	const settingsRef = useRef({
		scale   : 100,
		dataSize: 10,
		timeStep: 1000,
		pause   : true,
	})
	let settings = settingsRef.current
	const [update, setUpdate] = useState(true);
	// const [dataSize, setDataSize] = useState(10);
	const addDataRef = useRef<HTMLInputElement | null>(null);
	// const setDataSizeRef = useRef<HTMLInputElement>(null);
	const timeStepRef = useRef({value: 1000});

	useEffect(() => {
		// if (addDataRef.current) {
		// 	addDataRef.current.valueAsNumber = +(Math.random() * scale)
		// }

		// console.log({socket})
		// socket?.on('user', (data = {}) => {
		// 	console.log('Received data:', data);
		// 	// setScale(() => data.scale)
		// 	settingsRef.current.scale = data.scale
		// });

		socket?.on('device:scale', (scaleValue = 0) => {
			// setScale(scaleValue)
			setUpdate(x => !x)
			settingsRef.current.scale = scaleValue
			console.log({scaleValue})
		});
		////////////
		let internalID = -1
		let s = Math.random() * settings.scale
		loop()

		function loop() {
			setTimeout(() => loop(), settings.timeStep || 1000)
			if (settings.pause) return
			// s += Math.random() * settings.scale * (Math.random() < 0.9 ? 1 : -20 * Math.random())
			s = Math.random() * settings.scale
			const number = Math.max(0, Math.floor(s))
			s = number;
			const t = Math.floor(Math.random() * 10)
			socket?.emit('data:add', [number, t] as any);
		}

		//////////

		return () => {
			socket?.off('device:scale');
			// socket?.off('user');

			if (!settings.pause)
				autoAddOff()
			if (internalID != -1)
				clearInterval(internalID)
		}
	}, [socket])

	useEffect(() => {
		// console.log('up: ', settings)
		settings = settingsRef.current
	}, [update])

	function addData() {
		setUpdate(x => !x)
		const number = addDataRef.current?.valueAsNumber || Math.random() * settings.scale
		const t = Math.floor(Math.random() * 10)
		socket?.emit('data:add', [number, t] as any);
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
					<h4 className="text-white font-medium text-large">Router simulator</h4>
				</CardHeader>
				<CardBody className="overflow-visible py-2">
					<div className="p-1 pb-2">
						<h4 className="text-white/90 font-medium text-gl">V-out: {settings.scale}</h4>
						<h4 className="text-white/90 font-medium text-gl">Data Size: {settings.dataSize}</h4>
						<h4 className="text-white/90 font-medium text-gl">Pause: {settings.pause ? 'true' : 'false'}</h4>
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
						<span className="text-default-300">Auto add data</span>
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