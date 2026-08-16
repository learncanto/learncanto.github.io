  String.prototype.format = function () {
    return this.replace(/\{(\d+)\}/g, (m, n) => arguments[n] );
  };
  var template = '<BR><SPAN CLASS=k>{0}</SPAN><SPAN CLASS=s>{1}</SPAN><IMG SRC="ocrat/{2}.jpg"><BR>{3}({4}){5} {6}, {7}; {8}<br><br>',
      sentence = '{0} <span class="c">{1}</span>, {2}; {3}<br>'

soundManager.setup({ waitForWindowLoad: true, debugMode: false });
var lshk = null, content, contents, chars, toggle = true,
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

  displayAllCharacters();
});

// lshk.dict contains Chinese characters mapped to their data, has 13051 items;
// field [4] is the frequency (1 = most common, 8 = rarest)
function displayAllCharacters () {
  var keys = Object.keys(lshk.dict).sort(function (a, b) {
    return lshk.dict[a][4] - lshk.dict[b][4]; // common use first
  });

  $('#characters').html(
    '<button class="up">&#9650;</button><br>' +
    keys.map(function (char) {
      return createbtn(char, lshk.dict[char][1], toggle);
    }).join('')
  );

  $('#characters button.up').on('click', function (){
    document.getElementById('container').scrollIntoView();
  });

  $('#characters button:not(.up)').on('click', getid);
}

function getid (e) {
  var $el = $(e.target);
  characterDetail( $el.data('id') || $el.text()[0] );
  document.getElementById('contents').scrollIntoView();
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
  if (toggle) $('.s').css('color', '#9900cc');
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
          chars.push(createspan(e, lshk.dict[e][1], toggle, content[0]));
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
  $('.v').on('click', getid);

  $('.c').on('click', function () {
    audio.playlist = $(this).text().split(/\s+/).map(function(char) {
      return char in lshk.mp3 ? char : '_chirp';
    });
    playAudio(0);
  });
  return false;
}

function createspan (trad, simp, toggle, content){
  var char = toggle ? simp || trad : trad;
  var data = char === trad ? '' : ' data-id="' + trad + '"'; // 不承认主义
  var result = content === trad ? char : '<span class="v"' + data + '>' + char + '</span>';
  return result;
}

function createbtn (trad, simp, toggle){
  var char = toggle ? simp || trad : trad;
  var data = char === trad ? '' : ' data-id="' + trad + '"'; // 不承认主义
  return '<button' + data + '>' + char + '</button>';
}
