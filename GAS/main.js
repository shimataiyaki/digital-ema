// ★★★ 本番環境のスプレッドシートIDに差し替えてください。 ★★★
var SPREADSHEET_ID = 'XXXXXXXXXX';
var CACHE_PREFIX = 'displayedIndices_';

// ウェブアプリのエントリポイント（JSONP対応APIサーバー）
function doGet(e) {
  var callback = e.parameter.callback || 'callback';
  var type = e.parameter.type;
  var data;

  if (type === 'notification') {
    data = getRecentNicknames();
  } else {
    // ハイブリッド方式に変更
    data = getHybridWishes();
  }

  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  output.setContent(callback + '(' + JSON.stringify(data) + ');');
  return output;
}

// タイムスタンプが今日かどうかを判定
function isToday(timestamp) {
  if (!timestamp) return false;
  var date = new Date(timestamp);
  var today = new Date();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
}

// 今日の日付文字列を取得（キャッシュキー用）
function getTodayKey() {
  var today = new Date();
  return Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyyMMdd');
}

// ★ ハイブリッド方式：キュー優先＋ランダム補充 ★
function getHybridWishes() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  // 当日の全データを取得
  var range = sheet.getRange(2, 1, lastRow - 1, 3);
  var values = range.getValues();

  // 当日の投稿を抽出（インデックスは0始まり）
  var todayPosts = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var timestamp = row[0];
    var wish = row[1];
    var nickname = row[2];
    if (wish && wish.toString().trim() !== '' && isToday(timestamp)) {
      todayPosts.push({
        index: i,  // values内のインデックス（0始まり）
        wish: wish.toString().trim(),
        nickname: nickname ? nickname.toString().trim() : '匿名'
      });
    }
  }

  var totalToday = todayPosts.length;
  if (totalToday === 0) return [];

  // 表示済みインデックスをキャッシュから取得
  var cache = CacheService.getScriptCache();
  var cacheKey = CACHE_PREFIX + getTodayKey();
  var cached = cache.get(cacheKey);
  var displayedSet = {};
  if (cached) {
    var displayedArr = cached.split(',');
    for (var i = 0; i < displayedArr.length; i++) {
      if (displayedArr[i] !== '') {
        displayedSet[parseInt(displayedArr[i])] = true;
      }
    }
  }

  // キュー（未表示かつ到着順）
  var queue = [];
  for (var i = 0; i < totalToday; i++) {
    if (!displayedSet[todayPosts[i].index]) {
      queue.push(todayPosts[i]);
    }
  }

  var displayCount = 15;
  var result = [];

  // ① キューから優先的に最大15件
  while (result.length < displayCount && queue.length > 0) {
    var post = queue.shift();
    result.push(post);
    displayedSet[post.index] = true;
  }

  // ② 表示枠が余っていればランダム補充（当日の全投稿から、重複を避けて選ぶ）
  var remaining = displayCount - result.length;
  if (remaining > 0 && totalToday > result.length) {
    // 既に表示中 or 表示済みのインデックスを除外
    var excluded = {};
    for (var i = 0; i < result.length; i++) {
      excluded[result[i].index] = true;
    }
    for (var key in displayedSet) {
      excluded[key] = true;
    }

    // 候補インデックスを収集
    var candidates = [];
    for (var i = 0; i < totalToday; i++) {
      if (!excluded[todayPosts[i].index]) {
        candidates.push(todayPosts[i]);
      }
    }

    // 候補からランダムに必要数だけ選ぶ
    var n = Math.min(remaining, candidates.length);
    for (var i = 0; i < n; i++) {
      var randIdx = Math.floor(Math.random() * candidates.length);
      result.push(candidates[randIdx]);
      displayedSet[candidates[randIdx].index] = true;
      candidates.splice(randIdx, 1);
    }
  }

  // ③ 表示済みセットをキャッシュに保存（当日中有効）
  var updatedDisplayedArr = [];
  for (var key in displayedSet) {
    if (displayedSet[key]) {
      updatedDisplayedArr.push(key);
    }
  }
  cache.put(cacheKey, updatedDisplayedArr.join(','), 21600); // 6時間

  // フロントエンドが期待する形式に変換
  return result.map(function(post) {
    return {
      wish: post.wish,
      nickname: post.nickname
    };
  });
}

// 直近30秒以内に奉納されたニックネームを最大5件返す（今日のデータのみ）
function getRecentNicknames() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var now = new Date();
  var recentNicknames = [];

  for (var i = lastRow; i >= 2; i--) {
    var timestamp = sheet.getRange(i, 1).getValue();
    if (!timestamp) continue;

    if (!isToday(timestamp)) continue;

    var secondsDiff = (now - timestamp) / 1000;
    if (secondsDiff > 30) continue;

    var nickname = sheet.getRange(i, 3).getValue();
    if (nickname && nickname.toString().trim() !== '') {
      var name = nickname.toString().trim();
      if (!recentNicknames.includes(name)) {
        recentNicknames.push(name);
      }
    }

    if (recentNicknames.length >= 5) break;
  }

  return recentNicknames;
}
