function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('デジタル絵馬')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getLatestWishes() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    return []; // データがない場合は空配列を返す
  }
  
  // 2行目から最終行まで、B列（願い事）とC列（ニックネーム）を取得
  var range = sheet.getRange(2, 2, lastRow - 1, 2);
  var values = range.getValues();
  
  // 願い事とニックネームをオブジェクトにして、最新順にする
  var wishes = [];
  for (var i = values.length - 1; i >= 0; i--) {
    var wishText = values[i][0];
    var nickname = values[i][1];
    
    // 願い事が空でない場合のみ追加
    if (wishText && wishText.trim() !== '') {
      var displayName = (nickname && nickname.trim() !== '') ? nickname.trim() : '匿名';
      wishes.push({
        nickname: displayName,
        wish: wishText.trim()
      });
    }
  }
  
  return wishes;
}
