/* eslint-disable linebreak-style */
/* eslint-disable semi */
/* eslint-disable linebreak-style */

import { useEffect, useRef } from 'react'
import * as paper from 'paper'
import { IPosition2D } from '../../lib/script'
import { Paper } from '@mui/material'

export interface IBrailleCanvasProps {
  dots: IPosition2D[];
  className?: string;
}

const pxMmRatio = 4.9
const radius = 1

const BrailleCanvas = (props: IBrailleCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {

    paper.setup('braille-canvas');

    props.dots.forEach(dot => {
      const dotPath = new paper.Path.Circle(
        new paper.Point(dot.x * pxMmRatio, dot.y * pxMmRatio),
        (radius / 2) * pxMmRatio
      )
      dotPath.fillColor = new paper.Color('black')
    })
  }, [props.dots])


  return (
    <Paper variant='outlined' style={{
      width: '100%',
      height:'100%'
    }}>
      <canvas
        id="braille-canvas"
        ref={canvasRef}
        style={{
          width:'100%',
          height: '100%'
        }}
      />
    </Paper>
  )
}

export default BrailleCanvas
