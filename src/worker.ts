let _wasmModule = {}
globalThis.wasmModule = {}
globalThis.CApi = {}
globalThis.debugPayload = []
console.log(`1`);

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
let inited = false
const handleInit = async () => {
  if (inited) {
    return
  }
  inited = true
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
    console.log('eval-value:', ret);
  } else {
    // 保存 DAP 消息
    globalThis.debugPayload.push(payload)
  }
}
