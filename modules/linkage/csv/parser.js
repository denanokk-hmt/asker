'use struct';

//Read CSV
const parseData = (spreadsheet) => {
  return arranger2(spreadsheet)
}
module.exports.parseData = parseData

/**
 * Make for Bwing type response Array
 * No Associative array(slider, chip) Base arrangement 
 * @param {*} data 
 */
function arranger2(data) {
  const default_column_type_pos = 1 //csvデータのtypeのカラム位置 
  const default_column_msg_pos = 2 //csvデータのmessageのカラム位置
  const default_column_qty = 3 //csvデータの必須カラム,
  const default_column_name_pos = 3 //csvデータのカラム名の位置
  const value_column_pos = default_column_qty + 1 //csvデータの入力値の開始位置
  let column
  let num
  let sliders
  let resMsg
  let resArry = []
  for(let i in data) {
    resMsg = {}    
    switch (data[i][default_column_type_pos]) {
      case 'text' :
      case 'command' :
      case 'takeover_to_op' :
        resMsg = {
          type: data[i][default_column_type_pos],
          content: {
            message: data[i][default_column_msg_pos].replace(/\r?\n/g, '\\n'),
          },
        }
        break;
      case 'markdown' :
        let msg = data[i][default_column_msg_pos].replace(/###/g, data[i][3])
        msg = msg.replace(/&&&/g, data[i][4])
        resMsg = {
          type : data[i][default_column_type_pos],
          content : {
            message : msg,
          }
        }
        break;
      case 'telephone' :
        resMsg = {
          type : data[i][default_column_type_pos],
          content : {
            message : data[i][default_column_msg_pos],
            value : data[i][default_column_qty],
          }
        }
        break;
      case 'mail' :
        resMsg = {
          type : data[i][default_column_type_pos],
          content : {
            message : data[i][default_column_msg_pos],
            value : data[i][default_column_qty],
          }
        }
        break;
      case 'image' :
        resMsg = {
          type : data[i][default_column_type_pos],
          content : {
            message : data[i][default_column_msg_pos].replace(/\r?\n/g, '\\n'),
            img_url : data[i][default_column_qty],
            alt : data[i][value_column_pos],
          }
        }
        break;
      case 'string_string_slider' :
      case 'string_value_slider' :
      case 'string_image_slider' :
      case 'item_image_slider' :
      case 'link_image_slider' :
        column = data[i][default_column_name_pos].replace(/\r?\n/g, ',').split(',')
        num = 0
        sliders = []
        for (let y = value_column_pos; y < data[i].length; y++ ) {          
          let values = data[i][y].replace(/\r?\n/g, '|').split('|')
          let val = {}
          if (column.length == values.length) {
            for (let z in column) {
              val[column[z]] = values[z]
            }
            sliders.push(val)
          }
        }
        resMsg = {
          type : data[i][default_column_type_pos],
          content : {
            message : data[i][default_column_msg_pos].replace(/\r?\n/g, '\\n'),
            sliders,
          },
        }
        break;
      case 'string_string_chip' :
      case 'string_value_chip' :
      case 'string_avatar_chip' :
      case 'list' :
        column = data[i][default_column_name_pos].replace(/\r?\n/g, ',').split(',')
        num = 0
        let chips = []
        for (let y = value_column_pos; y < data[i].length; y++ ) {          
          let values = data[i][y].replace(/\r?\n/g, '|').split('|')
          let val = {}
          if (column.length == values.length) {
            for (let z in column) {
              val[column[z]] = values[z]
            }
            chips.push(val)
          }
        }
        resMsg = {
          type : data[i][default_column_type_pos],
          content : {
            message : data[i][default_column_msg_pos].replace(/\r?\n/g, '\\n'),
            chips,
          },
        }
        break;
      case 'dialog':
        let messages = data[i][default_column_msg_pos].replace(/message:/, '|').replace(/chip_accept:/, '|').replace(/chip_deny:/, '|').split("|")
        const message = messages[1].replace(/\r?\n/g, '\\n').replace(/(.*)\\n/g, '$1')
        const chip_accept = messages[2].replace(/\r?\n/g, '')
        const chip_deny = messages[3].replace(/\r?\n/g, '')
        let dialog_items = []
        let item_value ={}
        let dialog_values = []
        let z = -1

        let dialog_keys = []
        for (let y = default_column_name_pos; y < data[i].length; y++ ) {
          let values = data[i][y].replace(/\r?\n/g, '|').split('|')
          if (values[0].match("type:")) {
            z++
            dialog_values = []
            dialog_keys[0] = values[0].replace(/type:/, '')
            dialog_keys[1] = values[1].replace(/label:/, '')
            dialog_keys[2] = values[2].replace(/key:/, '')
          } else {
            if (values[1] && values[2]) {
              dialog_values.push({
                item_name : values[1],
                item_value : values[2],
              })
            }
          }
          //everytime rewrite item values
          item_value = {
            type : dialog_keys[0],
            label : dialog_keys[1],
            key : dialog_keys[2],
            values : dialog_values,
          }
          dialog_items[z] = item_value
        }

        resMsg = {
          type : data[i][default_column_type_pos],
          content : {
            message,
            chip_accept,
            chip_deny,
            dialog_items,
          },
        }
        break;
      case 'youtube':
        resMsg = {
          type: data[i][default_column_type_pos],
          content: {
            message: data[i][default_column_msg_pos].replace(/\r?\n/g, '\\n'),
            videoId: data[i][3], // Youtube動画のID
            autoplay: Boolean(data[i][4]), // 自動再生するかのフラグ. モバイルでは無視される
          },
        }
        break;
      case 'image_card' :
        const img_url = data[i][value_column_pos].split('\n')[0];
        const link_label = data[i][value_column_pos].split('\n')[1];
        const link_url = data[i][value_column_pos].split('\n')[2];

        resMsg = {
          type: data[i][default_column_type_pos],
          content:{
            message: data[i][default_column_msg_pos].replace(/\r?\n/g, '\\n'),
            text: data[i][5].replace(/\r?\n/g, '\\n'),
            image: img_url,
            link: {
              url: link_url,
              label: link_label,
            } ,
          }
        }
        break;
      default :
    }
    //Set bot talking for response set
    resArry[ data[i][0] ] = resMsg;
  }
  return resArry
}

/**
 * \n replace to \\n 
 * @param {*} data 
 */
function replaceN(data) {
  let resMsg
  let resArry = []
  for(let i in data) {
    let res = []
    resMsg = data[i][1].replace(/\r?\n/g, '\\n')
    resArry[ data[i][0] ] = resMsg;
  }
  return resArry
}