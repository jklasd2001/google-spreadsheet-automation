// download.js
const fs = require('fs')

const mkdirp = require('mkdirp')

const {
  loadSpreadsheet,
  localesPath,
  lngs,
  columnKeyToHeader,
  SHEET_INFO,
  NOT_AVAILABLE_CELL,
} = require('./index')

// 스프레드시트 -> json
const fetchTranslationsFromSheetToJson = async (doc, sheetId) => {
  const sheet = doc.sheetsById[sheetId]

  if (!sheet) {
    return {}
  }

  const lngsMap = {}
  const rows = await sheet.getRows()

  rows.forEach((row) => {
    const key = row.get(columnKeyToHeader.key)
    lngs.forEach((lng) => {
      const translation = row.get(columnKeyToHeader[lng])

      // NOT_AVAILABLE_CELL("_N/A") means no related language
      if (translation === NOT_AVAILABLE_CELL) {
        return
      }

      if (key === 'undefined') {
        return
      }

      if (!lngsMap[lng]) {
        lngsMap[lng] = {}
      }

      lngsMap[lng][key] = translation || '' // prevent to remove undefined value like ({"key": undefined})
    })
  })

  return lngsMap
}

// 디렉토리 설정
const checkAndMakeLocaleDir = (dirPath, subDirs) => {
  return new Promise((resolve) => {
    subDirs.forEach((subDir, index) => {
      mkdirp(`${dirPath}/${subDir}`, (err) => {
        if (err) {
          throw err
        }

        if (index === subDirs.length - 1) {
          resolve()
        }
      })
    })
  })
}
// json 파일 업데이트
const updateJsonFromSheet = async (namespace, sheetId) => {
  await checkAndMakeLocaleDir(localesPath, lngs)

  const doc = await loadSpreadsheet()

  // console.log(doc)
  const lngsMap = await fetchTranslationsFromSheetToJson(doc, sheetId)

  // console.log(lngsMap)

  fs.readdir(localesPath, (error, lngs) => {
    if (error) {
      throw error
    }

    for (const lng of lngs) {
      const localeJsonFilePath = `${localesPath}/${lng}/${namespace}.json`

      // console.log(lngsMap['vn'])
      const jsonString = JSON.stringify(lngsMap, null, 2)

      fs.writeFile(localeJsonFilePath, jsonString, 'utf8', (err) => {
        if (err) {
          throw err
        }
      })
    }
  })
}

for (const n of SHEET_INFO) {
  updateJsonFromSheet(n.name, n.id)
}
