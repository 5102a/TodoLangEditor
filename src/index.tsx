import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as monaco from 'monaco-editor';
import './index.css';
import { useEffect, useRef, useState } from 'react';
const worker = new Worker('./worker.js', {
  credentials: 'same-origin'
});

console.log(222);

let reqId = 1;
function sendBreakpointMessage(list: any[], file = 'index.js') {
  const breakpoints: any[] = [];

  for (let bpList of list) {
    breakpoints.push({
      line: bpList.line,
      column: bpList.column
    });
  }
  const envelope = {
    type: 'breakpoints',
    breakpoints: {
      path: file,
      breakpoints: breakpoints.length ? breakpoints : undefined
    }
  };
  return sendThreadMessage(envelope);
}

function sendStopOnException() {
  const envelope = {
    type: 'stopOnException',
    stopOnException: false
  };
  return sendThreadMessage(envelope);
}

function sendContinue() {
  const envelope = {
    type: 'continue'
  };
  return sendThreadMessage(envelope);
}

function sendReq(cmd: string, args: any) {
  const envelope = {
    type: 'request',
    request: {
      request_seq: reqId++,
      command: cmd,
      args: args
    }
  };
  return sendThreadMessage(envelope);
}

function sendCmdStackTrace(args = { startFrame: 0, levels: 20, threadId: 1 }) {
  return sendReq('stackTrace', args);
}

function sendCmdScopes(args = { frameId: 0 }) {
  return sendReq('scopes', args);
}

function sendCmdVariables(args = { variablesReference: 1 }) {
  return sendReq('variables', args);
}

function sendCmdContinue(args = { threadId: 1 }) {
  return sendReq('continue', args);
}

function sendThreadMessage(envelope: any) {
  // console.log(`sent: ${JSON.stringify(envelope)}`);

  let json = JSON.stringify(envelope);

  // console.log('envelope', json);
  const encoder = new TextEncoder();
  const jsonBuffer = encoder.encode(json);
  // not efficient, but protocol is then human readable.
  // json = 1 line json + new line
  let messageLength = jsonBuffer.byteLength + 1;
  let length = '00000000' + messageLength.toString(16) + '\n';
  length = length.substr(length.length - 9);
  return JSON.stringify({
    type: 'info',
    payload: length + json + '\n'
  });
}

const App = () => {
  const [res, setRes] = useState('');
  const [lines, setLines] = useState('1,3,5');
  const [input, setInput] = useState(
    `
let count = 0

function fibNumber(n) {
    count++
    if (n == 1 || n == 2)
        return 1

    return fibNumber(n - 1) + fibNumber(n - 2)
}

fibNumber(3)`
  );
  const ref = useRef<any>();

  let divNode;
  const assignRef = React.useCallback((node) => {
    // On mount get the ref of the div and assign it the divNode
    divNode = node;
  }, []);

  React.useEffect(() => {
    if (divNode && !ref.current) {
      const editor = monaco.editor.create(divNode, {
        minimap: { enabled: false },
        language: 'javascript',
        value: input
      });
      ref.current = editor;

      // ref.current?.deltaDecorations(
      //   [],
      //   [
      //     {
      //       range: new monaco.Range(1, 1, 10, 1),
      //       options: {
      //         isWholeLine: true,
      //         inlineClassName: 'myInlineDecoration'
      //       }
      //     }
      //   ]
      // );
      // editor.onMouseDown((e) => {
      //   if (
      //     e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN
      //   ) {
      //     // This is a click on the line number
      //     console.log(
      //       'Clicked on line number: ' + e.target.position.lineNumber
      //     );
      //   }
      // });
    }
  }, [assignRef]);

  useEffect(() => {
    let ws;

    // 监听来自 Worker 的消息
    worker.onmessage = function (event) {
      setRes((p) => p + '\n' + event.data.payload);
      const { type, payload } = event.data;
      console.log('后端响应', payload);

      switch (type) {
        case 'debug_message':
          // const id = setInterval(() => {
          //   if (ws.readyState === WebSocket.OPEN) {
          //     ws.send(payload);
          //     clearInterval(id);
          //   }
          // }, 20);
          break;
        case 'inited':
          // ws = new WebSocket('ws://127.0.0.1:8091');

          // ws.onopen = function () {
          //   console.log('websocket open');
          // };

          // ws.onclose = function () {
          //   worker.postMessage({
          //     type: 'close'
          //   });
          // };

          // ws.onmessage = function (event) {
          //   worker.postMessage({
          //     type: 'debug_message',
          //     payload: event.data
          //   });
          // };
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
    <div
      style={{
        display: 'flex'
      }}
    >
      <div
        ref={assignRef}
        style={{
          width: '50%',
          height: '300px',
          margin: '10px'
        }}
      ></div>
      <div>
        <div>
          断点行<input onChange={(e) => setLines(e.target.value)}></input>
          <button
            onClick={() => {
              const list = [
                sendBreakpointMessage(
                  lines
                    .split(',')
                    .map((item) => ({ line: parseInt(item), column: 1 }))
                ),
                sendStopOnException(),
                sendCmdStackTrace(),
                sendCmdScopes(),
                sendCmdVariables(),
                sendContinue()
              ];
              list.forEach((v) => {
                console.log('前端请求', v);
                worker.postMessage({
                  type: 'debug_message',
                  payload: v
                });
              });
              worker.postMessage({
                type: 'debug_message',
                payload: JSON.stringify({
                  type: 'eval',
                  payload: input
                })
              });
            }}
          >
            调试
          </button>
          <button
            onClick={() => {
              worker.postMessage({
                type: 'close'
              });
            }}
          >
            结束
          </button>
        </div>
        <div>
          <button
            onClick={() => {
              const list = [
                sendContinue(),
                sendCmdStackTrace(),
                sendCmdScopes(),
                sendCmdVariables()
              ];
              list.forEach((v) => {
                console.log('前端请求1', v);
                worker.postMessage({
                  type: 'debug_message',
                  payload: v
                });
              });
            }}
          >
            下一步
          </button>
        </div>
        <div>
          <div>输出</div>
          <div>{res}</div>
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
