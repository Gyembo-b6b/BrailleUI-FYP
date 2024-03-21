/* eslint-disable linebreak-style */
export const sleep = (ms:number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}