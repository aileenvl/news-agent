/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    urlImports: [
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai',
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm',
      'https://storage.googleapis.com/jmstore/WebAIDemos/models/Gemma2'
    ]
  },
  webpack: (config) => {
    // See https://webpack.js.org/configuration/resolve/#resolvealias
    config.resolve.alias = {
        ...config.resolve.alias,
        "sharp$": false,
        "onnxruntime-node$": false,
    }
    return config;
}
}

module.exports = nextConfig
