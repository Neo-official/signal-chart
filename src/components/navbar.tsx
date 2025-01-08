"use client"
import {
	Navbar as NextUINavbar,
	NavbarContent,
	NavbarBrand,
	NavbarItem,
	Link,
} from "@nextui-org/react";
import NextLink from "next/link";
import { link as linkStyles } from "@nextui-org/theme";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
	Logo,
} from "@/components/icons";
import { usePathname } from "next/navigation";

export const Navbar = () => {
	const pathname = usePathname();
	// console.log({pathname})
	return (
		<NextUINavbar maxWidth="xl" position="sticky">
			<NavbarContent justify="start">
				<NavbarBrand as="li" className="gap-3 max-w-fit">
					<NextLink className="flex justify-start items-center gap-1" href="/">
						<Logo/>
						<p className="font-bold text-inherit">Signal Chart</p>
					</NextLink>
				</NavbarBrand>
			</NavbarContent>

			<NavbarContent className="gap-4" justify="center">
				{siteConfig.navItems.map((item) => (
					<NavbarItem key={item.href} isActive={item.href === pathname}>
						<Link
							className={clsx(
								linkStyles({color: "foreground"}),
								"data-[active=true]:text-primary data-[active=true]:font-medium",
							)}
							// color="foreground"
							aria-current={item.href === pathname ? "page" : undefined}
							href={item.href}
						>
							{item.label}
						</Link>
					</NavbarItem>
				))}
			</NavbarContent>

			<NavbarContent justify="end">
				<ThemeSwitch/>
			</NavbarContent>
		</NextUINavbar>
	);
};
