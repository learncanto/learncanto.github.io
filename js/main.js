  String.prototype.format = function () {
    return this.replace(/\{(\d+)\}/g, (m, n) => arguments[n] );
  };
  var template = '<BR><SPAN CLASS=k>{0}</SPAN><SPAN CLASS=s>{1}</SPAN><IMG SRC="ocrat/{2}.jpg"><BR>{3}({4}){5} {6}, {7}; {8}<br><br>',
      sentence = '{0} <span class="c">{1}</span>, {2}; {3}<br>'

soundManager.setup({ waitForWindowLoad: true, debugMode: false });
var lshk = null, content, contents, chars, simpMode = false, // false = traditional, true = simplified
  audio = {}; audio.playlist = [];

function playAudio(idx){
  if (audio.nowPlaying) {
    audio.nowPlaying.destruct();
  }

  audio.nowPlaying = soundManager.createSound({
    id: 'lshkAudio',
    url: "yale/" + audio.playlist[idx] + ".mp3",
    autoLoad: true,
    autoPlay: true,
    onfinish: function(){
      idx ++;
      if (idx < audio.playlist.length) {
        playAudio(idx);
      } else {
        audio.playlist = [];
      }
    }
  });
}

soundManager.onready(function() {
  $('#back-to-top').on('click', function(e){
    document.getElementById('container').scrollIntoView();
  });

  $('#simp-toggle').on('click', function (){
    simpMode = !simpMode;
    $('#simp-toggle').text(simpMode ? '简' : '繁');
    displayAllCharacters();
    var id = $('.k').text(); // refresh the open entry too
    if (id) characterDetail(id);
  });

  displayAllCharacters();

  // deep link: open the entry named in the URL anchor, e.g. "#人"
  var char = hashToChar();
  if (char) {
    characterDetail(char);
    document.getElementById('contents').scrollIntoView();
  }
});

// browser back/forward: re-render whatever character the anchor points at
$(window).on('hashchange', function () {
  var char = hashToChar();
  if (char) {
    characterDetail(char);
    document.getElementById('contents').scrollIntoView();
  } else {
    $('#contents').empty(); // back past the first character: plain list again
    document.getElementById('container').scrollIntoView();
  }
});

// the URL anchor holds the character, e.g. "#人" or "#%E4%BA%BA"
function hashToChar () {
  var h = location.hash.slice(1);
  try { h = decodeURIComponent(h); } catch (e) {}
  return h in lshk.dict ? h : null;
}

// lshk.dict contains Chinese characters mapped to their data, has 13051 items;
// field [4] is the frequency (1 = most common, 8 = rarest)
function displayAllCharacters () {
  var keys = Object.keys(lshk.dict).sort(function (a, b) {
    return lshk.dict[a][4] - lshk.dict[b][4]; // common use first
  });

  $('#characters').html(
    '<button class="up">&#9650;</button><br>' +
    keys.map(function (char) {
      return createbtn(char, lshk.dict[char][1], simpMode);
    }).join('')
  );

  $('#characters button.up').on('click', function (){
    document.getElementById('container').scrollIntoView();
  });
}

// show the entry (definition + example sentences) for one character
function characterDetail (e) {
  content = $.extend([], lshk.dict[e]);

  content[6] = content[6].split(/\s+/).map(function(e){ // yale
    return '<span class="c">' + e + '</span>';
  }).join(' ');

  $('#contents').html( template.format( ...content )
    .replace(/<IMG SRC="ocrat\/.jpg">/, '')
  );
  if (simpMode) $('.s').css('color', '#9900cc');
  if ( lshk.sent_hash[content[0]] ) {
    lshk.sent_hash[content[0]].forEach(function(e){
      contents = $.extend([], lshk.sent_array[e]), chars = []; var flag = true;
      if(contents[0].split('').every(function(e){
        if (e === '(') flag = false;
        if (e === ')') flag = true;
        if (!flag || e.match(/[^\u4E00-\u9FFF]/)) {
          chars.push(e);
          return true;
        }
        try {var freq = lshk.dict[e][4];}
        catch (error) {console.log(e); freq = 1}
        if (flag) {
          chars.push(createspan(e, lshk.dict[e][1], simpMode, content[0])); 
          return true;
        }
        return false;
      })) {
        contents[0] = chars.join('');
        contents[1] = contents[1].replace(/`/g, '');
        $('#contents').append(sentence.format( ...contents ));
      }
    });
  }
  $('.c').on('click', function () {
    audio.playlist = $(this).text().split(/\s+/).map(function(char) {
      return char in lshk.mp3 ? char : '_chirp';
    });
    playAudio(0);
  });
  return false;
}

function createspan (trad, simp, simpMode, content){
  var char = simpMode ? simp || trad : trad;
  var data = char === trad ? '' : ' data-id="' + trad + '"'; // 不承认主义
  // link to the traditional entry via the URL anchor
  var result = content === trad ? char : '<a class="v" href="#' + encodeURIComponent(trad) + '"' + data + '>' + char + '</a>';
  return result;
}

function createbtn (trad, simp, simpMode){
  var char = simpMode ? simp || trad : trad;
  var data = char === trad ? '' : ' data-id="' + trad + '"'; // 不承认主义
  // href always targets the traditional entry (the dictionary key)
  return '<a href="#' + encodeURIComponent(trad) + '"' + data + '>' + char + '</a>';
}
