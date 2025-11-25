'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site";

export default function Login() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [isVisible, setIsVisible] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const router = useRouter();

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');

		axios.post(siteConfig.API.LOGIN, { username, password })
			.then(response => {
				localStorage.setItem('authToken', response.data.token);
				router.refresh();
				window.location.reload();
			})
			.catch(error => {
				if (axios.isAxiosError(error))
					setError(error.response?.data?.message || 'Login failed. Please try again.');
				else
					setError('An unexpected error occurred');
			})
			.finally(() => setIsLoading(false));
	};

	return (
		<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-2 pb-4">
					<CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
					<CardDescription className="text-center">
						Enter your credentials to access the admin panel
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleLogin} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								placeholder="Enter your username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<div className="relative">
								<Input
									id="password"
									placeholder="Enter your password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									type={isVisible ? "text" : "password"}
									required
									disabled={isLoading}
									className="pr-10"
								/>
								<button
									type="button"
									onClick={() => setIsVisible(!isVisible)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									{isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</button>
							</div>
						</div>
						{error && (
							<div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
								{error}
							</div>
						)}
						<Button
							type="submit"
							className="w-full"
							disabled={isLoading}
						>
							{isLoading ? 'Signing in...' : 'Sign In'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
