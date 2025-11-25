"use client"
import NextLink from "next/link";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
	const pathname = usePathname();
	const [isAuthorized, setIsAuthorized] = useState(false);
	
	useEffect(() => {
		setIsAuthorized(!!localStorage?.getItem("authToken"));
	}, []);

	const handleLogout = () => {
		localStorage.removeItem("authToken");
		window.location.href = "/admin";
	};

	return (
		<nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-16 items-center justify-between">
				<div className="flex items-center gap-6">
					<NextLink className="flex items-center gap-2" href="/">
						<Logo/>
						<span className="font-bold text-lg">{siteConfig.name}</span>
					</NextLink>
					<nav className="hidden md:flex items-center gap-6">
						{siteConfig.navItems.map((item) => (
							<NextLink
								key={item.href}
								href={item.href}
								className={clsx(
									"text-sm font-medium transition-colors hover:text-primary",
									pathname === item.href
										? "text-foreground"
										: "text-muted-foreground"
								)}
							>
								{item.label}
							</NextLink>
						))}
					</nav>
				</div>
				<div className="flex items-center gap-2">
					{isAuthorized && (
						<Button variant="ghost" size="sm" onClick={handleLogout}>
							<LogOut className="w-4 h-4 mr-2" />
							Logout
						</Button>
					)}
					<ThemeSwitch/>
				</div>
			</div>
		</nav>
	);
};
