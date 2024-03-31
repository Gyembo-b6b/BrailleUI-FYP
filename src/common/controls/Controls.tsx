/* eslint-disable linebreak-style */
// eslint-disable-next-line linebreak-style
//@ts-ignore: : needs React
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react'
import { Button, MenuItem, Select } from '@mui/material'
import { useState } from 'react'

export interface IControlsProps {
  className?:string
  canPrint: boolean
  onSendClicked: ()=>void
  onGenerateClicked: ()=>void
  onSettingsClicked: ()=>void
  onDebugClicked?: ()=>void
}

const Controls = (props:IControlsProps)=>{
  const [buttonVisible, setButtonVisible] = useState(false)
  const handleStorageItem = (type:'A4'|'Braille') => {
    localStorage.setItem('p-type',type)
    console.log(localStorage.getItem('p-type'))
  }
  const toggleButtonPress = () => {
    setButtonVisible(!buttonVisible)
  }
  const handleSend = ()=>{
    props.onSendClicked()
  }

  const handleGenerate = ()=>{
    props.onGenerateClicked()
  }

  const handleSettings = ()=>{
    props.onSettingsClicked()
  }
  return (
    <div className={`${props.className?props.className:''}`}>
      <Button variant='contained' onClick={handleGenerate}>
        GENERATE
      </Button>
      <Button disabled={!props.canPrint} variant='contained' onClick={handleSend}>
        PRINT
      </Button>
      <Button variant='contained' onClick={handleSettings}>
        SETTINGS
      </Button>
      <Button variant='contained' onClick={toggleButtonPress}>
        Select Paper Type
      </Button>
      <Select open={buttonVisible}>
        <MenuItem value="A4" onClick={()=>{
          toggleButtonPress()
          handleStorageItem('A4')
        }}>A4 Paper</MenuItem>
        <MenuItem value="Braille" onClick={()=>{
          toggleButtonPress()
          handleStorageItem('Braille')
        }}>Braille Paper</MenuItem>
      </Select>
      {/* <Button variant='contained' onClick={handleDebug}>
        DEBUG
      </Button> */}
    </div>
  )
}

export default Controls