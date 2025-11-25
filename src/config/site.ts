export type SiteConfig = typeof siteConfig;

export const siteConfig = {
	name       : "Signal Chart",
	description: "signal chart",
	navItems   : [
		{
			label: "Home",
			href : "/",
		},
		{
			label: "Admin",
			href : "/admin",
		},
	],
	API:{
		LOGIN : "/api/login"
	}
};
