const path = require('path');
const htmlWebpackPlugin = require('html-webpack-plugin');
const copy = require('copy-webpack-plugin');
module.exports = {
  mode: 'development',
  entry: {
    app: './src/index.tsx',
    'editor.worker': 'monaco-editor-core/esm/vs/editor/editor.worker.js',
    todoLangWorker: './src/todo-lang/todolang.worker.ts',
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
    filename: (chunkData) => {
      switch (chunkData.chunk.name) {
        case 'editor.worker':
          return 'editor.worker.js';
        case 'todoLangWorker':
          return 'todoLangWorker.js';
        case 'worker':
          return 'worker.js';
        default:
          return 'bundle.[hash].js';
      }
    },
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
      }
    ]
  },

  plugins: [
    new htmlWebpackPlugin({
      template: './src/index.html'
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
        {
          from: 'src/main.wasm.js',
          to: 'main.wasm.js'
        },
        {
          from: 'src/main.js.symbols',
          to: 'main.js.symbols'
        },
        {
          from: 'src/main.wasm.symbols',
          to: 'main.wasm.symbols'
        },
        {
          from: 'src/main.wasm.map',
          to: 'main.wasm.map'
        }
      ]
    })
  ]
};
