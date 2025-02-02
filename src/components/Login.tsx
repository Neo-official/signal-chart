'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
	Card,
	CardBody,
	CardHeader,
	Input,
	Button,
} from "@nextui-org/react";
import { siteConfig } from "@/config/site";

export default function Login() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	// noinspection JSUnusedLocalSymbols
	const [isVisible, setIsVisible] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const router = useRouter();

	// const toggleVisibility = () => setIsVisible(!isVisible);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');

		try {
			const response = await axios.post(siteConfig.API.LOGIN, {
				username,
				password,
			});

			// Store the token
			localStorage.setItem('authToken', response.data.token);

			// Update axios default headers for future requests
			// api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

			// Redirect to admin page
			// router.push('/admin');
			router.refresh()
			window!.location!.reload()
		}
		catch (error) {
			if (axios.isAxiosError(error))
				setError(error.response?.data?.message || 'Login failed. Please try again.');
			else
				setError('An unexpected error occurred');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center">

			<Card className="w-full max-w-md">
				<CardHeader className="flex flex-col gap-1 items-center">
					<h1 className="text-2xl font-bold">Login</h1>
					<p className="text-default-500">{error}</p>
				</CardHeader>
				<CardBody>
					<form onSubmit={handleLogin} className="flex flex-col gap-4">
						<Input
							label="Username"
							placeholder="Enter your username"
							value={username}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
							variant="bordered"
							isRequired
							errorMessage={error ? ' ' : undefined}
						/>
						<Input
							label="Password"
							placeholder="Enter your password"
							value={password}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
							type={isVisible ? "text" : "password"}
							variant="bordered"
							isRequired
							errorMessage={error}
							// endContent={
							// 	<button
							// 		className="focus:outline-none"
							// 		type="button"
							// 		onClick={toggleVisibility}
							// 	>
							// 		{isVisible ? (
							// 			<EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
							// 		) : (
							// 			<EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
							// 		)}
							// 	</button>
							// }
						/>
						<Button
							type="submit"
							color="primary"
							isLoading={isLoading}
							className="w-full"
						>
							Sign In
						</Button>
					</form>
				</CardBody>
			</Card>
		</div>
	);
}
