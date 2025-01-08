export type SiteConfig = typeof siteConfig;

export const siteConfig = {
	name       : "Signal-chart",
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
		{
			label: "Router",
			href : "/router",
		},
	],
	ROUTE_URL: {
		ADMIN: "/admin",
		ROUTER: "/router",
		HOME: "/"
	},
	API:{
		LOGIN : "/api/login",
		LOGOUT : "/api/logout",
		USER : "/api/user"
	}
};
