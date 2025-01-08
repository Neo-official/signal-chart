/** @type {import('next').NextConfig} */
const nextConfig = {
	// generateBuildId: () => 'build',
	// output: 'export',
	// distDir: 'out',
	reactStrictMode: true,
	eslint: {
		ignoreDuringBuilds: true
	},
	typescript: {
		ignoreBuildErrors: true
	},
	experimental: {
		disableOptimizedLoading: true
	},
	webpack: (config) => {
		config.resolve = {
			...config.resolve,
			fallback: {
				...config.resolve.fallback,
				canvas: false,
			},
		}
		return config
	},
};

module.exports = nextConfig;
