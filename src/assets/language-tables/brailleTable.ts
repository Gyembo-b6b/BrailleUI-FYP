import { braille6 } from './braille6'
import { braille6dzongkha } from './braille6dzongkha'
import { braille8new } from './braille8new'


export interface IBrailleTable {
  name: string,
  type: '6dots' | '8dots' | '12dots'
  dotMap: {[key:number]:{[key:number]:number}},
  numberPrefix:number[],
  latinToBraille:{[key:string]:number[]} 
}  

const buildName = (table:IBrailleTable)=>{
  return `${table.name} - ${table.type}`
}

const brailleTableMap = new Map<string,IBrailleTable>()
brailleTableMap.set(buildName(braille6),braille6)
brailleTableMap.set(buildName(braille8new),braille8new)
brailleTableMap.set(buildName(braille6dzongkha),braille6dzongkha)
const brailleTableOptions:string[] = Array.from(brailleTableMap.keys())
console.debug(brailleTableMap)
export {  
  brailleTableMap,
  brailleTableOptions
}
