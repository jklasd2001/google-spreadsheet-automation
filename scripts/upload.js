const fs = require('fs')

const {
  localesPath,
  lngs,
  columnKeyToHeader,
  SHEET_INFO,
  NOT_AVAILABLE_CELL,
  loadSpreadsheet,
  getPureKey,
} = require('./index')

const headerValues = ['key', 'ko', 'en', 'ja']

const addNewSheet = async (doc, title, sheetId) => {
  const sheet = await doc.addSheet({
    sheetId,
    title,
    headerValues,
  })

  return sheet
}

const updateTranslationsFromKeyMapToSheet = async (doc, keyMap, sheetId) => {
  //시트 타이틀
  let sheet = doc.sheetsById[sheetId]

  if (!sheet) {
    const title = 'Please change sheet name'
    sheet = await addNewSheet(doc, title, sheetId)
  }

  const rows = await sheet.getRows()

  // find exsit keys
  const existKeys = {}
  const addedRows = []

  // 모든 로우를 순회합니다.
  rows.forEach((row) => {
    const key = row.get(columnKeyToHeader.key)
    if (keyMap[key]) {
      existKeys[key] = true
    }
  })

  //스프레트시트에 row 넣는 부분
  for (const [key, translations] of Object.entries(keyMap)) {
    if (!existKeys[key]) {
      const row = {
        [columnKeyToHeader.key]: key,
        ...Object.keys(translations).reduce((result, lng) => {
          const header = columnKeyToHeader[lng]
          result[header] = translations[lng]

          return result
        }, {}),
      }

      addedRows.push(row)
    }
  }
  // upload new keys
  await sheet.addRows(addedRows)
}

// key값에 따른 언어 value
const toJson = (keyMap) => {
  const json = {}

  Object.entries(keyMap).forEach(([_, keysByPlural]) => {
    for (const [keyWithPostfix, translations] of Object.entries(keysByPlural)) {
      json[keyWithPostfix] = {
        ...translations,
      }
    }
  })

  return json
}

// 언어 key : value 값 저장
const gatherKeyMap = (keyMap, lng, json) => {
  for (const [keyWithPostfix, translated] of Object.entries(json)) {
    const key = getPureKey(keyWithPostfix)

    if (!keyMap[key]) {
      keyMap[key] = {}
    }

    const keyMapWithLng = keyMap[key]
    if (!keyMapWithLng[keyWithPostfix]) {
      keyMapWithLng[keyWithPostfix] = lngs.reduce((initObj, lng) => {
        initObj[lng] = NOT_AVAILABLE_CELL

        return initObj
      }, {})
    }

    keyMapWithLng[keyWithPostfix][lng] = translated
  }
}

const updateSheetFromJson = async (namespace, sheetId) => {
  const doc = await loadSpreadsheet()

  fs.readdir(localesPath, (error, lngs) => {
    if (error) {
      throw error
    }

    const keyMap = {}

    for (const lng of lngs) {
      const localeJsonFilePath = `${localesPath}/${lng}/${namespace}.json`
      //.json file read
      const json = fs.readFileSync(localeJsonFilePath, 'utf8')
      gatherKeyMap(keyMap, lng, JSON.parse(json))
    }

    //스프레드 시트에 업데이트
    updateTranslationsFromKeyMapToSheet(doc, toJson(keyMap), sheetId)
  })
}

for (const n of SHEET_INFO) {
  updateSheetFromJson(n.name, n.id)
}
