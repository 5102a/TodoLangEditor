import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { setupLanguage } from './todo-lang/setup';
import { Editor } from './components/Editor/Editor';
import { languageID } from './todo-lang/config';
import {
  parseAndGetSyntaxErrors,
  parseAndGetASTRoot
} from './language-service/Parser';
import { useEffect, useRef, useState } from 'react';
const worker = new Worker('./worker.js', {
  credentials: 'same-origin'
});

setupLanguage();
const App = () => {
  const [res, setRes] = useState('');
  const [input, setInput] = useState(
    JSON.stringify({
      source: { name: 'test.js', path: 'd:\\hub\\quickjs\\test.js' },
      lines: [1],
      breakpoints: [{ line: 1 }],
      sourceModified: false
    })
  );
  const ref = useRef<Worker>();

  useEffect(() => {
    let ws;

    // 监听来自 Worker 的消息
    worker.onmessage = function (event) {
      setRes(event.data.payload);
      const { type, payload } = event.data;

      switch (type) {
        case 'debug_message':
          const id = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(payload);
              clearInterval(id);
            }
          }, 20);
          break;
        case 'inited':
          ws = new WebSocket('ws://127.0.0.1:8091');

          ws.onopen = function () {
            console.log('websocket open');
          };

          ws.onclose = function () {
            worker.postMessage({
              type: 'close'
            });
          };

          ws.onmessage = function (event) {
            worker.postMessage({
              type: 'debug_message',
              payload: event.data
            });
          };
          break;
        default:
          break;
      }
    };

    // 初始化 worker
    worker.postMessage({
      type: 'init'
    });
  }, []);

  return (
    <div>
      <div style={{ height: '200' }}>
        <button
          onClick={() => {
            worker.postMessage({
              source: 'debug',
              payload: input
            });
          }}
        >
          启动
        </button>
        <input value={input} onChange={(e) => setInput(e.target.value)}></input>
        <div>11{res}</div>
      </div>
      <Editor language={languageID} value={res}></Editor>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
