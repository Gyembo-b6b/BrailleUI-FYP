/* eslint-disable linebreak-style */
//@ts-ignore: : needs React
import React, { useState } from 'react'
import TextInput from '../common/text-input/TextInput'
import Controls from '../common/controls/Controls'
import { brailleToGCode } from '../lib/script'
import BrailleCanvas from '../common/braille-canvas/BrailleCanvas'
import { gcodeParse } from '../lib/brailleDraw'
import { ISerialState, sendSerial } from '../lib/serial'
import { Grid } from '@mui/material'
import UiAlert, { IUiAlertProps } from '../common/ui-alert/UiAlert'
import './brailleUi.scss'
import UiHeader from '../common/ui-header/UiHeader'
import UiFooter from '../common/ui-footer/UiFooter'
import UiSettings, { IBrailleSettings } from '../common/ui-settings/UiSettings'
import { brailleTableOptions } from '../assets/language-tables/brailleTable'
import PrintState from '../common/print-state/PrintState'
// eslint-disable-next-line linebreak-style

let isPrinting = false

const defaultSettings: IBrailleSettings = {
  tableName: brailleTableOptions[0],
  homeY: true,
  ejectPaper: true,
  velocity: 2000,
  paperWidth: 0,
  paperHeight: 0
}

const defualtSerialState: ISerialState = {
  state: 'idle',
  progress: 0
}

const BrailleUI = ()=>{
  const [brailleSettings,setBrailleSettings] = useState(defaultSettings)
  const [text,setText] = useState('')
  const [showSettings,setShowSettings] = useState(false)
  const [gcode,setGcode] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [paths,setPaths] = useState([] as any[]) 
  const [printState,setPrintState] = useState(defualtSerialState)
  const [alert,setAlert] = useState({
    title: 'ERROR',
    message: '',
    show: false,
    handleClose: ()=>{setAlert({show:false})}
  } as IUiAlertProps)

  const handlePrinterInfo = (info:string)=>{
    console.debug(info)
  }

  const handleTextChanged = (value:string)=>{
    setText(value)
    if (gcode.length > 0){
      setGcode('')
    }
    if (paths.length>0)[
      setPaths([])
    ]
  }
  const handleSendClicked = ()=>{
    if (isPrinting){
      const alertProps:IUiAlertProps = {
        title: 'WARNING',
        message: 'Already printing. Wait!',
        show: true,
        handleClose: ()=>{setAlert({show:false})}
      }
      setAlert(alertProps)
      return
    } else if (gcode.length === 0) {
      const alertProps:IUiAlertProps = {
        title: 'ERROR',
        message: 'There is nothing to print',
        show: true,
        handleClose: ()=>{setAlert({show:false})}
      }
      setAlert(alertProps)
      return
    }
    isPrinting = true
    sendSerial(gcode.split('\n'),115200,handlePrinterInfo,(state:ISerialState)=>setPrintState(state))
      .catch((err:Error)=>{
        const alertProps:IUiAlertProps = {
          title: 'ERROR',
          message: `${err.message}`,
          show: true,
          handleClose: ()=>{setAlert({show:false})}
        }
        setAlert(alertProps)
      })
      .finally(()=>isPrinting=false)
  }
  const handleGenerateClicked = ()=>{
    if (text.length === 0){
      const alertProps:IUiAlertProps = {
        title: 'ERROR',
        message: 'There is no text to generate braille for.',
        show: true,
        handleClose: ()=>{setAlert({show:false})}
      }
      setAlert(alertProps)
    }
    const _gcode = brailleToGCode(text,brailleSettings) || ''
    setGcode(_gcode)
    console.debug(text,_gcode)
    const pathArray = gcodeParse(_gcode)
    setPaths(pathArray)
  }
  const handleSettingsClose = (settings:IBrailleSettings)=>{
    setBrailleSettings(settings)
    setShowSettings(false)
    if (gcode.length > 0){
      setGcode('')
    }
    if (paths.length>0)[
      setPaths([])
    ]
  }
  const handleSettingsClicked = ()=>{
    setShowSettings(true)
  }

  return(
    <div className=''>
      <UiHeader className='br-ui-header'/>
      <Grid 
        container 
        spacing={2} 
        className='br-ui-main'
        justifyContent="center"
        alignItems="stretch"
      >
        <Grid item xs={4} className='br-text-input' >
          <TextInput  className='br-text-input__content'  onChange={(handleTextChanged)}/>
        </Grid>
        <Grid item xs={8} className='br-braille-canvas'>
          <BrailleCanvas className='br-braille-canvas__content' dots={paths} />
        </Grid>
        <Grid item xs={12} className='br-braille-controls'>
          <Controls 
            canPrint={gcode.length > 0}
            className='br-braille-controls__content'
            onSendClicked={handleSendClicked} 
            onGenerateClicked={handleGenerateClicked} 
            onSettingsClicked={handleSettingsClicked}
          />
        </Grid>
        <Grid item xs={12} className='br-braille-print-state'>
          <PrintState className='br-braille-print-state__content' state={printState}/>
        </Grid>
      </Grid>
      <UiSettings 
        show={showSettings}
        handleClose={handleSettingsClose} 
        settings={brailleSettings}      
      />
      <UiFooter className='br-ui-footer'/>
      <UiAlert {...alert}/>
    </div>
  )
}

export default BrailleUI