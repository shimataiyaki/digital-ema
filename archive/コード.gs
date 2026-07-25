// ★★★ 本番環境のスプレッドシートIDに差し替えてください。★★★
var SPREADSHEET_ID = 'XXXXXXXXXXXXXXX';
var SHEET_NAME = 'フォームの回答 1';

function doGet(e) {
  // JSONPのコールバック関数名をリクエストパラメータから取得
  var callback = e.parameter.callback || 'handleArchiveData';
  
  var data = JSON.stringify(getAllWishes());
  
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  // コールバック関数でラップして返す
  output.setContent(callback + '(' + data + ');');
  
  return output;
}

function getAllWishes() {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return [{ timestamp: new Date(), wish: '混雑のため処理に失敗しました', nickname: 'システム' }]; }

  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) {
      return [{ timestamp: 'エラー', wish: 'シートが見つかりません', nickname: 'デバッグ' }];
    }

    // データ基準をB列（想い）に設定
    var lastRow = sheet.getRange("B1").getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow();
    if (lastRow < 2) return [];

    var range = sheet.getRange(2, 1, lastRow - 1, 3);
    var values = range.getValues();

    return values.map(row => ({
      timestamp: row[0] ? Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm') : '日時不明',
      wish: row[1] || '(想いが空です)',
      nickname: row[2] || '匿名'
    }));

  } catch (e) {
    return [{ timestamp: 'エラー', wish: e.toString(), nickname: 'デバッグ' }];
  } finally {
    lock.releaseLock();
  }
}
