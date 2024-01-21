const path = require('path');
const htmlWebpackPlugin = require('html-webpack-plugin');
const copy = require('copy-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const APP_DIR = path.resolve(__dirname, './src');
const MONACO_DIR = path.resolve(__dirname, './node_modules');

module.exports = {
  mode: 'development',
  entry: {
    app: './src/index.tsx',
    worker: './src/worker.ts'
  },
  devServer: {
    caches: false,
    headers: {
      // 如果需要用到ffmpeg合并视频，需要将COEP和COOP打开，来确保ShareArrayBuffer能够正常使用
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  },
  output: {
    globalObject: 'self',
    path: path.resolve(__dirname, 'dist')
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.css']
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    clientLogLevel: "none",
  },
  module: {
    rules: [
      {
        test: /\.tsx?/,
        loader: 'ts-loader'
      },
      {
        test: /\.css/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.ttf$/,
        include: MONACO_DIR,
        use: ['file-loader'],
      }
    ]
  },

  plugins: [
    new htmlWebpackPlugin({
      template: './src/index.html'
    }),
    new MonacoWebpackPlugin({
      // available options are documented at https://github.com/microsoft/monaco-editor/blob/main/webpack-plugin/README.md#options
      languages: ['javascript']
    }),
    new copy({
      patterns: [
        {
          from: 'src/main.wasm',
          to: 'main.wasm'
        },
        {
          from: 'src/main.js',
          to: 'main.js'
        },
      ]
    })
  ]
};
