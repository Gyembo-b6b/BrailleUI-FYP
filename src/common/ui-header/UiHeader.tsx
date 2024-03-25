/* eslint-disable linebreak-style */
//@ts-ignore: : needs React
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useEffect, useState } from 'react'
import { Typography } from '@mui/material'
import BrailleI from '../../assets/images/braille_i.png'

interface IUiHeader {
  className?:string
}

const UiHeader = (props:IUiHeader)=>{
  return(
    <div className={props.className}>
      <img
        className='br-ui-header__logo'
        src={`${BrailleI}?w=50&h=50&fit=crop&auto=format`}
        srcSet={`${BrailleI}?w=50&h=50&fit=crop&auto=format&dpr=2 2x`}
        alt='braille icon'
        loading="lazy"
      />
      <Typography variant='h3'>
      DUAL LANGUAGE BRAILLE TRANSLATOR<br/>
      </Typography>
    </div>
  )
}

export default UiHeader