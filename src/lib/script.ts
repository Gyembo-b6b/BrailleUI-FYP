/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable semi */
// Heavily based on code from StephaneG
// original code https://github.com/crocsg/BrailleRap 

import { IBrailleTable, brailleTableMap } from '../assets/language-tables/brailleTable'
import { compairCharAgaistDevnagriNumber, getPrefixforSpecialcharacter } from './charUtils'
import { IBrailleSettings } from '../common/ui-settings/UiSettings'
import { PaperSize } from '../utils/papersize'


const braille = {
  marginWidth: 2,
  marginHeight: 3,
  paperWidth: 210,
  paperHeight:290,
  letterWidth:3,
  dotRadius: 0.1,
  letterPadding: 6,
  linePadding:4,
  headDownPosition: -2.0,
  headUpPosition: 10,
  speed: 2500,
  delta: false,
  goToZero: true,
  invertX: true,
  invertY: true,
  mirrorX: true,
  mirrorY: true,
  svgStep: 2,
  svgDots: true,
  svgPosX: 0,
  svgPosY: 0,
  // svgScale: 1,
  language: '12 dots',
  GCODEup: 'M3 S0',
  GCODEdown: 'M3 S1',
  GCODEafterpause: 'G4 P50',
  usedotgrid: false,
  homeY: true,
  ejectPaper: true,
}

let xhead = 0
let yhead = 0

// Replace a char at index in a string
function replaceAt(s:string, n:number, t:string) {
  return s.substring(0, n) + t + s.substring(n + 1)
}

export interface IPosition2D {
  x: number,
  y: number
}

export interface IGCode {
  code:string
}

const GCODEdotposition:IPosition2D[] = []
const GCODEsvgdotposition:IPosition2D[] = []

// const gcodeSetAbsolutePositioning = function() {
//   return 'G90;\r\n'
// }

const gcodeMotorOff = function()
{
  return 'M84;\r\n'
}

const gcodeHome = function ()
{
  let str = 'G28 X;\r\n'
  console.log('Executing gcodeHome');
  if (braille.homeY){
    str += 'G28 Y;\r\n'
    console.log('Moving to Y home position');
  }
  
  return str
}

const gcodeResetPosition = function(X:number, Y:number, Z:number) {
  return 'G92' + gcodePosition(X, Y, Z)
}

const gcodeSetSpeed = function(speed:number) {
  return `G1 F${speed};\r\n`
}

const gcodePosition = function(X?:number, Y?:number, Z?:number) {
  let code = ''
  if(X === undefined && Y === undefined && Z === undefined) {
    throw new Error('Null position when moving')
  }
  if(X) {
    code += ' X' + X.toFixed(2)
  }
  if(Y) {
    code += ' Y' + Y.toFixed(2)
  }
  if(Z) {
    code += ' Z' + Z.toFixed(2)
  }
  code += ';\r\n'
  return code
}

const gcodeGoTo = function(X?:number, Y?:number, Z?:number) {
  return 'G0' + gcodePosition(X, Y, Z)
}

const gcodeMoveTo = function(X?:number, Y?:number, Z?:number) {
  return 'G1' + gcodePosition(X, Y, Z)
}

const gcodeMoveToCached = function (X?:number,Y?:number,Z?:number)
{
  if (X != null)
    xhead = X
  if (Y != null)
    yhead = Y

  return gcodeMoveTo (X,Y,Z)
}


const gcodeprintdot = function () {
  let s = braille.GCODEdown + ';\r\n'
  s += braille.GCODEup + ';\r\n'
  s += braille.GCODEafterpause + ';\r\n'

  return (s)
}

const gcodePrintDotCached = function ()
{
  if (xhead != null && yhead != null)
    GCODEdotposition.push ({x:xhead,y:yhead})

  return gcodeprintdot ()
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const gcodeGraphDotCached = function ()
{
  if (xhead != null && yhead != null)
    GCODEsvgdotposition.push ({x:xhead,y:yhead})

  return gcodeprintdot ()
}

const buildoptimizedgcode = function ()
{
  const gridsizex = Math.floor(braille.paperWidth / braille.svgStep)
  const gridsizey = Math.floor (braille.paperHeight / braille.svgStep)



  const dotgrid = new Array<number[]>(gridsizex)
  for (let i = 0;i < gridsizex; i++)
  {
    dotgrid[i] = new Array<number>(gridsizey)
    dotgrid[i].fill (0)
  }
  let codestr = gcodeHome ()



  codestr += gcodeSetSpeed(braille.speed)


  if(braille.goToZero) {
    codestr += gcodeMoveTo(0, 0, 0)
  }


  GCODEdotposition.sort (function (a,b) {
    if (a.y == b.y) return (a.x - b.x)
    return (a.y - b.y)
  })

  const sortedpositions = gcodesortzigzag(GCODEdotposition)

  console.log(`sorted positions: ${sortedpositions.length}`)

  if (braille.usedotgrid == true)
    console.log ('filtering dot neighbor')

  for (let i = 0; i < sortedpositions.length; i++)
  {
    codestr += gcodeMoveTo(sortedpositions[i].x, sortedpositions[i].y)
    codestr += gcodeprintdot ()
    dotgrid[Math.floor(sortedpositions[i].x / braille.svgStep)][Math.floor(sortedpositions[i].y / braille.svgStep)] = 1
  }

  // print svg
  for (let i=0; i < GCODEsvgdotposition.length; i++)
  {
    const gx = Math.floor (GCODEsvgdotposition[i].x / braille.svgStep)
    const gy = Math.floor (GCODEsvgdotposition[i].y / braille.svgStep)

    if (gx < 0 || gx >= gridsizex)
      continue
    if (gy < 0 || gy >= gridsizey)
      continue

    if (braille.usedotgrid  == true)
    {
      if (dotgrid[gx][gy] == 0)
      {
        codestr += gcodeMoveTo (GCODEsvgdotposition[i].x, GCODEsvgdotposition[i].y)
        codestr += gcodeprintdot ()
        dotgrid[gx][gy] = 1
      }
      else
      {
        console.log ('dot filtered')
      }
    }
    else
    {
      codestr += gcodeMoveTo (GCODEsvgdotposition[i].x, GCODEsvgdotposition[i].y)
      codestr += gcodeprintdot ()
    }
  }

  if (braille.ejectPaper){
    codestr += gcodeMoveTo (0,braille.paperHeight)
  } else {
    codestr += gcodeMoveTo (0,0)
  }
  
  codestr += gcodeMotorOff ()
  return (codestr)
}

// gcode sort by line
const gcodesortzigzag = function (positions:IPosition2D[])
{
  let i
  let  s = 0
  let e = 0
  let dir = 1
  let tmp = []
  const sorted:IPosition2D[] = []

  if (positions == null)
    return (sorted)

  while (e < positions.length)
  {
    while ((positions[s].y == positions[e].y) )
    {
      e++
      if (e == (positions.length))
      {
        break
      }
    }

    //if (e - s >= 0)
    {
      for (let i = s; i < e; i++)
      {
        tmp.push (positions[i])
      }
      tmp.sort (function (a,b) {
        if (a.y == b.y) return ((a.x - b.x) * dir)
        return (a.y - b.y)
      })

      for(i = 0; i < tmp.length; i++)
        sorted.push (tmp[i])
      tmp = []
      dir = - dir

      s = e
    }
    if (e >= positions.length)
    {
      break
    }
  }

  return (sorted)
}

export interface ICharIndices {
  xAct:number,
  yAct:number,
  indices:number[]
}

const textToIndices = (
  _text: string,
  _brailleTable:IBrailleTable, 
  _brailleSettings: typeof braille
)=>{
  const latinToBrailleMap = new Map(Object.entries(_brailleTable.latinToBraille))
  const indiceArray:ICharIndices[] = []
  const is8dot = _brailleTable.type === '8dots'
  const is12dot = _brailleTable.type === '12dots'
  let isWritingNumber = false
  let isSpecialchar = false
  _brailleSettings.letterPadding = is12dot ? 9:3;
  let currentX = _brailleSettings.marginWidth
  let currentY = _brailleSettings.marginHeight
  console.log(_text)
  let indices:number[]|undefined|boolean = []
  for(let i = 0 ; i < _text.length ; i++) {
    try{
      if(getPrefixforSpecialcharacter(_text[i+1])){
        console.log('is special character');
        const specialCharacter = _text[i]+_text[i+1]
        indices = latinToBrailleMap.get(specialCharacter);
        console.log(specialCharacter)
        i=(i+1);
      }else{
        const char = _text[i]
        // check special cases:
        const charIsCapitalLetter = is12dot ? false : is8dot ? /[A-Z]/.test(char):false
        const charIsLineBreak = /\r?\n|\r/.test(char)
    
        // If char is line break: reset currentX and increase currentY
        if(charIsLineBreak) {
          currentY += (is8dot ? 2 : 3) * _brailleSettings.letterWidth + _brailleSettings.linePadding
          currentX = _brailleSettings.marginWidth
    
          if(currentY > _brailleSettings.paperHeight - _brailleSettings.marginHeight) { 				// if there is not enough space on paper: stop
            break
          }
          continue
        }
    
        indices = latinToBrailleMap.get(char)
    
        let devnagriNr = compairCharAgaistDevnagriNumber(char)
        if (typeof devnagriNr === 'string') {
          devnagriNr = parseInt(devnagriNr)
        }
        // handle special cases:
        if(!isWritingNumber && !isNaN(devnagriNr)) { 			// if we are not in a number sequence and char is a number: add prefix and enter number sequence
          indices = _brailleTable.numberPrefix
          i-- 													// we will reread the same character
          isWritingNumber = true
        } else if(isWritingNumber && char == ' ') {
          isWritingNumber = false
        } else if( charIsCapitalLetter ) { 
          console.log(charIsCapitalLetter)					// if capital letter: add prefix, lowerCase letter and reread the same char
          indices = [4, 6]
          _text = replaceAt(_text, i, _text[i].toLowerCase())
          i--
        }
        //@ts-ignore
        if(!isSpecialchar && getPrefixforSpecialcharacter(char).length > 0)
        {
          indices = getPrefixforSpecialcharacter(char)      
          i--; 													// we will reread the same character
          isSpecialchar = true
        }
      }
    }catch(err){
      console.log(err);
    }
    if (indices){
      indices = indices as number[]
      indiceArray.push({
        xAct:currentX,
        yAct:currentY,
        indices
      })
    }
    currentX += _brailleSettings.letterWidth + _brailleSettings.letterPadding

    // Test if there is enough room on the line to draw the next character
    if(currentX + _brailleSettings.letterWidth + _brailleSettings.dotRadius > _brailleSettings.paperWidth - _brailleSettings.marginWidth) { // if we can't: go to next line
      currentY += (is8dot ? 2 : 3) * _brailleSettings.letterWidth + _brailleSettings.linePadding
      currentX = _brailleSettings.marginWidth
    }
  }
  return indiceArray
}

// Draw braille and generate gcode
export function brailleToGCode(textToWrite:string,settings:IBrailleSettings) {
  const papertype = localStorage.getItem('p-type')
  const paperWidth = papertype === 'A4' ? PaperSize.A4.width : PaperSize.Braille.width
  const paperHeight = papertype == 'A4' ? PaperSize.A4.height : PaperSize.Braille.height
  braille.paperWidth = paperWidth
  braille.paperHeight = paperHeight
  braille.ejectPaper = true
  if (!brailleTableMap.has(settings.tableName)){
    console.error(`Table ${settings.tableName} does not exist`)
    return
  }
  const brailleTable:IBrailleTable = brailleTableMap.get(settings.tableName) 
  braille.speed = settings.velocity
  braille.homeY = settings.homeY
  braille.ejectPaper = settings.ejectPaper

  GCODEdotposition.length = 0

  const is8dot = brailleTable.type === '8dots';
  const is12dot = brailleTable.type === '12dots'
  const indicesArray = textToIndices(textToWrite,brailleTable,braille)
  for(let i = 0 ; i < indicesArray.length ; i++) {
    const indices = indicesArray[i]
    const currentX = indices.xAct
    const currentY = indices.yAct

    // compute corresponding printer coordinates
    let gx = braille.invertX ? -currentX : braille.paperWidth - currentX
    let gy = -currentY				// canvas y axis goes downward, printers goes upward

    if(braille.delta) { 				// delta printers have their origin in the center of the sheet
      gx -= braille.paperWidth / 2
      gy += braille.paperHeight / 2
    } else if(!braille.invertY) {
      gy += braille.paperHeight
    }

    // add gcode
    gcodeMoveToCached(braille.mirrorX ? -gx : gx, braille.mirrorY ? -gy : gy,0)
     
    // changing the indices for cell mappings for 12 dots and 8dots
    // check 12 dot and if true keep 4 else keep 2, 4 for 4 cols and 2 cols
    // Iterate through all indices
    for(let y = 0 ; y < (is8dot ? 4 : 3) ; y++) {
      for(let x = 0 ; x < (is12dot ? 4:2) ; x++) {
        if(indices.indices.indexOf(brailleTable.dotMap[x][y]) != -1) { 			// if index exists in current char: draw the dot
          const px = currentX + x * braille.letterWidth
          const py = currentY + y * braille.letterWidth
          // Compute corresponding gcode position
          if(x > 0 || y > 0) {
            gx = braille.invertX ? - px : braille.paperWidth - px
            gy = -py						// canvas y axis goes downward, printers goes upward
            if(braille.delta) { 			// delta printers have their origin in the center of the sheet
              gx -= braille.paperWidth / 2
              gy += braille.paperHeight / 2
            } else if(!braille.invertY){
              gy += braille.paperHeight
            }
            gcodeMoveToCached(braille.mirrorX ? -gx : gx, braille.mirrorY ? -gy : gy,0)
            //GCODEdotposition.push ({x:(braille.mirrorX ? -gx : gx, y:braille.mirrorY ? -gy : gy)});
          }
          // print dot at position
          gcodePrintDotCached ()
        }
      }
    }
  }
  const sortedgcode = buildoptimizedgcode()
  gcodeHome()
  return sortedgcode
}

