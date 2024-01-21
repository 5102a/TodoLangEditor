
let _wasmModule = {}
globalThis.wasmModule = {}
globalThis.CApi = {}
globalThis.debugPayload = []

const initCApi = () => {
  if (Object.keys(globalThis.wasmModule).length) {
    globalThis.CApi = {
      eval: (() => {
        const wrapper = globalThis.wasmModule.cwrap(
          'eval', // name of C function
          'string', // return type
          ['string'], // argument types
          { async: true },
          { async: true }
        );
        return (code: string) => wrapper(code)
      })(),
    }
  }
}

globalThis.onmessage = function (event) {
  const { type, payload } = event.data
  switch (type) {
    case 'init':
      handleInit()
      break;
    case 'close':
      console.log('debug 已关闭');
      break;
    case 'debug_message':
      handleDebugMessage(payload)
      break;
    default:
      return
  }
};

globalThis.onDebuggerMessage = (ctx: number, msg: string) => {
  // globalThis.context = ctx
  const [len, value] = msg.split('\n');
  // console.log('onDebuggerMessage:', msg);

  try {
    globalThis.postMessage({
      type: 'debug_message',
      payload: value
    })
  } catch (error) {
    // console.log('parse error', value)
  }
}


// globalThis.cReadDebugMessage = async () => {
//   let count = 0

//   const payload: string = await new Promise((rs) => {

//     const poll = () => {
//       if (globalThis.debugPayload.length) {
//         const payload = globalThis.debugPayload.shift();
//         if (payload) {
//           try {
//             if (JSON.parse(payload.slice(9)).breakpoints.path !== "d:\\hub\\quickjs\\test2.js") {
//               setTimeout(poll, 20);
//               return;
//             }
//           } catch (error) {

//           }
//           rs(payload);

//         }
//       } else if (++count >= 50 * 5) {
//         rs('');
//       } else {
//         setTimeout(poll, 20);
//       }
//     }

//     setTimeout(poll, 20);
//   });

//   count = 0;

//   console.log("payload:", payload, globalThis.debugPayload.length);



//   if (payload === '') {
//     return 0;
//   }

//   return payload;
// }

const handleInit = async () => {
  const init = await import('./main.js')
  // 调用 Wasm 模块中的函数
  await init(_wasmModule);
  globalThis.wasmModule = _wasmModule

  initCApi()

  globalThis.postMessage({
    type: 'inited',
    payload: ''
  })
}

const handleDebugMessage = async (data) => {
  const res = JSON.parse(data)
  const { type, payload } = res
  // console.log('handleDebugMessage:', payload);
  if (type === 'eval') {
    const ret = await globalThis.CApi.eval(payload)
    // console.log('eval-value:', ret);
  } else {
    // 保存 DAP 消息
    globalThis.debugPayload.push(payload)
  }
}
