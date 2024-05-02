/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { sleep } from './utils'

/* eslint-disable @typescript-eslint/no-unsafe-call */

const isSerial = 'serial' in navigator

const connectSerial = async (baud:number)=>{
  try{
    const port = await navigator.serial.requestPort()
    await port.open({ baudRate: baud })
    return port
  } catch (err) {
    console.error('Opening serial failed')
    throw err
  }
  
}

export interface ISerialState {
  state: 'idle' | 'connecting' | 'connected' | 'printing' | 'done',
  progress: number
}

export const sendSerial = async (
  gcode: string[], 
  baud: number,
  onPrinterInfo: (info:string)=>void,
  cb: (state:ISerialState)=>void
)=>{
  if (!gcode){
    console.warn('No GCode available')
    return
  }

  if (!isSerial){
    console.warn('Serial is not available')
    return
  }

  try{
    const port = await connectSerial(baud)
    const textEncoder = new TextEncoderStream()
    if (port){
      try{
        cb({state:'connecting',progress:0})
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const writableStreamClosed = textEncoder.readable.pipeTo(port.writable as WritableStream<Uint8Array>)
        console.log('0')
        const writer = textEncoder.writable.getWriter()
        console.log('1')
        const startupReader = port.readable.getReader() as ReadableStreamDefaultReader<Uint8Array>
        console.log('2')
        const printerInfo = await readStream(startupReader)
        console.log(printerInfo)
        startupReader.releaseLock()
        console.log('3')
        onPrinterInfo(printerInfo)
        console.log('4')
        cb({state:'connected',progress:0})
        console.log('5')
        console.debug(str2ab(printerInfo))
        if (printerInfo.startsWith('start') || printerInfo === '\n' || printerInfo==''){
          console.log('yes')
          await sleep(2000)
          const reader = port.readable.getReader() as ReadableStreamDefaultReader<Uint8Array>
          let lineProgress = 0
          try{
            for (const gcodeLine of gcode) {
              if (gcodeLine.length === 0 || gcodeLine === '\n'){
                continue
              }
              let sendLine = true
              while (sendLine) {
                sendLine = false  
                console.debug(`writing gcode: ${gcodeLine}`)
                await writer.write(gcodeLine)
                let res = '\n'
                res = await readStreamString(reader,true)
                console.debug(res,str2ab(res))
                if (res.startsWith('echo:busy: processing')){
                  await sleep(1000)
                  sendLine = true
                }
                else if (!res.endsWith('ok\n')) {
                  console.warn('serial not ending with ok EOL')
                  throw new Error(`WrongResponse: ${res}`)
                }
              }
              lineProgress += 1
              cb({state:'printing',progress:(lineProgress/gcode.length)*100})
            }
          }catch(err){
            console.log(err)
          }finally {
            writer.releaseLock()
            startupReader.releaseLock()
            reader.releaseLock()
            // await writer.close()
          }
        }
      }catch(err){
        console.log(err)
      }finally {
        cb({state:'done',progress:0})
        await port.forget()
      }
    }
  } catch (e) {
    console.warn(e)
    throw e
  }
}

const pump = async (
  reader:ReadableStreamDefaultReader<Uint8Array>, 
  chunks: Uint8Array[],
):Promise<Uint8Array[]>=>{
  const { value, done } = await reader.read()
  if (done || !value) {
    return chunks
  }
  chunks.push(value)
  return pump(reader, chunks)
}

const pumpString = async (
  reader:ReadableStreamDefaultReader<Uint8Array>, 
  str: string,
  oneLine = false
):Promise<string>=>{
  const { value, done } = await reader.read()
  if (done || !value) {
    console.debug('DONE')
    return str
  }
  str += ab2str(value)
  if (oneLine && str.endsWith('\n')) {
    console.debug('EOL')
    return str
  }
  console.debug(value)
  return pumpString(reader, str, oneLine)
}

const readStreamString = async (
  reader:ReadableStreamDefaultReader<Uint8Array>,
  oneLine: boolean
)=>{
  let stringText = ''
  let release = true
  setTimeout(function() {
    if (release){
      console.debug('readStreamString: serial read timeout')
      reader.releaseLock()
    }
  }, 5000)
  try {
    stringText = await pumpString(reader,stringText,oneLine)
  } catch (error) {
    console.error(error)
  }
  release = false
  return stringText
}

const readStream = async (
  reader:ReadableStreamDefaultReader<Uint8Array>
)=>{
  let stringText = ''
  setTimeout(function() {
    console.debug('readStream: serial read timeout')
    reader.releaseLock()
  }, 2000)
  const chunks:Uint8Array[] = []
  try {                                 
    await pump(reader,chunks)
  } catch (error) {
    //
  }

  chunks.forEach(arr => {
    stringText += ab2str(arr)
  })
  return stringText
}

const ab2str = (buf:ArrayBuffer) => {
  const array = Array.from(new Uint8Array(buf)).map(x=>x)
  return String.fromCharCode.apply(null, array)
}
const str2ab = (str:string) => {
  const buf = new ArrayBuffer(str.length*2) // 2 bytes for each char
  const bufView = new Uint16Array(buf)
  for (let i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}