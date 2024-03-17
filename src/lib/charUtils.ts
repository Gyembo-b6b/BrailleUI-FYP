export const compairCharAgaistDevnagriNumber = (char:string):number | string => {
  switch(char){
  case '१':
    return 1
  case '२':
    return 2
  case '३':
    return 3
  case '४':
    return 4
  case '५':
    return 5
  case '६':
    return 6
  case '७':
    return 7
  case '८':
    return 8
  case '९':
    return 9
  case '०':
    return 0
  default:
    return char
  }
}

export const getPrefixforSpecialcharacter = (char:string):number[]|boolean => {
  switch(char){
  case 'ྐ':
    return true
  case 'ྒ':
    return true;
  case 'ྔ':
    return true;
    case 'ྕ':
    return true;
  case 'ྗ':
    return true;
  case 'ྙ':
   return true;
  case 'ྟ':
    return true;
  case 'ྡ':
    return true;
  case 'ྣ':
    return true;
  case 'ྤ':
    return true;
  case 'ྦ':
    return true;
  case 'ྨ':
    return true;
  case 'ྩ':
    return true;
  case 'ྫ':
    return true;
  case 'ྷ':
    return true;
  default:
    return false;
  }
}