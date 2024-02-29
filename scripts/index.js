require('dotenv').config()

const { JWT } = require('google-auth-library')
const { GoogleSpreadsheet } = require('google-spreadsheet')

//구글 sheet json 파일
const i18nextConfig = require('../../i18next-scanner.config')

const spreadsheetDocId = process.env.NEXT_PUBLIC_GOOGLE_SPREAD_SHEET_DOC_ID
const ns = ['common', 'dashboard']
const lngs = i18nextConfig.options.lngs
const loadPath = i18nextConfig.options.resource.loadPath
const localesPath = loadPath.replace('/{{lng}}/{{ns}}.json', '')
const rePluralPostfix = new RegExp(/_plural|_[\d]/g)

const sheetId = [0]
const SHEET_INFO = [
  {
    name: 'vn',
    id: 1771609779,
  },
]
//번역이 필요없는 부분
const NOT_AVAILABLE_CELL = 'N/A'
//스프레드시트에 들어갈 header 설정
const columnKeyToHeader = {
  key: 'key',
  vn: 'vn',
}

const loadSpreadsheet = async () => {
  const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
  ]

  const jwt = new JWT({
    email: process.env.NEXT_PUBLIC_GOOGLE_SPREAD_SHEET_EMAIL,
    key: process.env.NEXT_PUBLIC_GOOGLE_SPREAD_SHEET_KEY,
    scopes: SCOPES,
  })

  // spreadsheet key is the long id in the sheets URL
  const doc = new GoogleSpreadsheet(spreadsheetDocId, jwt)
  await doc.loadInfo() // loads document properties and worksheets

  return doc
}

const getPureKey = (key = '') => {
  return key.replace(rePluralPostfix, '')
}

module.exports = {
  localesPath,
  ns,
  lngs,
  sheetId,
  SHEET_INFO,
  columnKeyToHeader,
  NOT_AVAILABLE_CELL,
  loadSpreadsheet,
  getPureKey,
}
