import {defineConfig} from 'vite';
export default defineConfig({define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{outDir:'terminal-build',emptyOutDir:true,lib:{entry:'terminal-docks.tsx',name:'TerminalLiquidDocks',formats:['iife'],fileName:()=> 'terminal-liquid-docks.js'},rollupOptions:{output:{assetFileNames:'terminal-liquid-docks.[ext]'}}}});
