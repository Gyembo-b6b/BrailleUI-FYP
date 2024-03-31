/* eslint-disable linebreak-style */
//@ts-ignore: : needs React
import React, { ChangeEvent, useState } from 'react'
import TextField from '@mui/material/TextField'

export interface ITextInputProps {
  className?:string,
  onChange: (value:string)=>void
}

const TextInput = (props:ITextInputProps)=>{
  const [text,setText] = useState('')
  const handleTextChange = (event:ChangeEvent<HTMLTextAreaElement>)=>{
    props.onChange(event.target.value),
    setText(event.target.value)
  }
  return(
    <TextField
      // maxRows={234}
      fullWidth
      error={text.length === 0}
      helperText={text.length === 0?'Input is empty':''}
      label="Input"
      multiline
      defaultValue=""
      onChange={handleTextChange}
    />
  )
}

export default TextInput