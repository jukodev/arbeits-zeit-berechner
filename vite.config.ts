import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		VitePWA({
			strategies: "injectManifest",
			srcDir: "src",
			filename: "sw.ts",
			registerType: "autoUpdate",
			includeAssets: ["favicon.svg"],
			manifest: {
				name: "Arbeits-Zeit-Berechner",
				short_name: "AZ-Berechner",
				description: "Arbeitszeitberechnung",
				theme_color: "#0f172a",
				background_color: "#0f172a",
				display: "standalone",
				orientation: "portrait",
				scope: "/",
				start_url: "/",
				icons: [
					{
						src: "pwa-192x192.svg",
						sizes: "192x192",
						type: "image/svg+xml",
					},
					{
						src: "pwa-512x512.svg",
						sizes: "512x512",
						type: "image/svg+xml",
					},
					{
						src: "pwa-512x512.svg",
						sizes: "512x512",
						type: "image/svg+xml",
						purpose: "maskable",
					},
				],
			},
			injectManifest: { globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"] },
		}),
	],
});
