var webContents, initialized

var player = {
    isPaused: true,
    volumePercent: 0,
    seekbarCurrentPosition: 0,
    seekbarCurrentPositionHuman: '0:00',
    likeStatus: 'INDIFFERENT',
    repeatType: 'NONE',
    queue: {
        currentIndex: 0,
        size: 0,
        data: [],
    },
    inLibrary: false,
}

var track = {
    author: '',
    title: '',
    album: '',
    cover: '',
    duration: 0,
    durationHuman: '0:00',
    statePercent: 0.0,
    url: '',
    id: '',
    isVideo: false,
    isAdvertisement: false,
    lyrics: {
        provider: '',
        data: '',
    },
}

function init(view) {
    webContents = view.webContents
    initialized = true
}

function getAllInfo() {
    return {
        player: getPlayerInfo(),
        track: getTrackInfo(),
    }
}

function getPlayerInfo() {
    if (webContents !== undefined) {
        isPaused(webContents)
        getVolume(webContents)
        getSeekbarPosition(webContents)
        getLikeStatus(webContents)
        getRepeatType(webContents)
        getQueue(webContents)
        inLibrary(webContents)
    }
    return player
}

function getTrackInfo() {
    if (webContents !== undefined) {
        getAuthor(webContents)
        getTitle(webContents)
        getAlbum(webContents)
        getCover(webContents)
        getDuration(webContents)
        getUrl(webContents)
        setPercent(player.seekbarCurrentPosition, track.duration)
        isVideo(webContents)
        isAdvertisement(webContents)
    }
    return track
}

function isPaused(webContents) {
    webContents
        .executeJavaScript(`document.getElementsByTagName('video')[0].paused;`)
        .then((isPaused) => {
            debug(`Is paused: ${isPaused}`)
            player.isPaused = isPaused
        })
        .catch((_) => console.log('error isPaused'))
}

function getTitle(webContents) {
    webContents
        .executeJavaScript(
            `document.getElementsByClassName('title ytmusic-player-bar')[0].innerText;`
        )
        .then((title) => {
            debug(`Title is: ${title}`)
            track.title = title
        })
        .catch((_) => console.log('error getTitle'))
}

function getDuration(webContents) {
    webContents
        .executeJavaScript(
            `document.getElementById('progress-bar').getAttribute('aria-valuemax');`
        )
        .then((duration) => {
            debug(`Duration is: ${parseInt(duration)}`)
            track.duration = parseInt(duration)
            track.durationHuman = convertToHuman(parseInt(duration))
        })
        .catch((_) => console.log('error getDuration'))
}

/**
 * Get Like status
 * LIKE | DISLIKE | INDIFFERENT
 * @param {*} webContents
 */
function getLikeStatus(webContents) {
    webContents
        .executeJavaScript(
            `document.getElementById('like-button-renderer').getAttribute('like-status');`
        )
        .then((likeStatus) => {
            debug(`Like status is: ${likeStatus}`)
            player.likeStatus = likeStatus
        })
        .catch((_) => console.log('error getLikeStatus'))
}

/**
 * GET CURRENT SEEK BAR POSITION
 * @param {*} webContents
 */
function getSeekbarPosition(webContents) {
    webContents
        .executeJavaScript(
            `document.getElementById('progress-bar').getAttribute('aria-valuenow');`
        )
        .then((position) => {
            debug(`Seekbar position is: ${parseInt(position)}`)
            player.seekbarCurrentPosition = parseInt(position)
            player.seekbarCurrentPositionHuman = convertToHuman(
                parseInt(position)
            )
        })
        .catch((_) => console.log('error getSeekbarPosition'))
}

function getVolume(webContents) {
    webContents
        .executeJavaScript(
            `document.getElementsByClassName('volume-slider style-scope ytmusic-player-bar')[0].getAttribute('value');`
        )
        .then((volume) => {
            debug(`Volume % is: ${parseInt(volume)}`)
            player.volumePercent = parseInt(volume)
        })
        .catch((_) => console.log('error getVolume'))
}

function getAuthor(webContents) {
    webContents
        .executeJavaScript(
            `
    var bar = document.getElementsByClassName('subtitle ytmusic-player-bar')[0];
				  
    if (bar.getElementsByClassName('yt-simple-endpoint yt-formatted-string')[0]) {
      title = bar.getElementsByClassName('yt-simple-endpoint yt-formatted-string')[0].innerText;
    } else if (bar.getElementsByClassName('byline ytmusic-player-bar')[0]) {
      title = bar.getElementsByClassName('byline ytmusic-player-bar')[0].innerText;
    }
    title;
            `
        )
        .then((author) => {
            debug(`Author is: ${author}`)
            track.author = author
        })
        .catch((_) => console.log('error getAuthor'))
}

function getAlbum(webContents) {
    webContents
        .executeJavaScript(
            `
      var album = '';
      var player_bar = document.getElementsByClassName("byline ytmusic-player-bar")[0].children;
      var arr_player_bar = Array.from(player_bar);
      
      arr_player_bar.forEach( function(data, index) {
      
       if (data.getAttribute('href') != null && data.getAttribute('href').includes('browse')) {
          album = data.innerText;
       }
      } )
      
      album
      `
        )
        .then((album) => {
            debug(`Album is: ${album}`)
            track.album = album
        })
        .catch((_) => console.log('error getAlbum'))
}

function getCover(webContents) {
    webContents
        .executeJavaScript(
            `
        var cover;

        var thumbnail = document.getElementsByClassName('thumbnail ytmusic-player no-transition')[0];
        var image = thumbnail.getElementsByClassName('yt-img-shadow')[0].src;

        cover = image;

        if (cover.includes("data:image")) {
          cover = document.getElementsByClassName("image ytmusic-player-bar")[0].src
        }

        cover;
      `
        )
        .then((cover) => {
            debug(`Cover is: ${cover}`)
            track.cover = cover
        })
        .catch((_) => console.log('error getCover'))
}

function getRepeatType(webContents) {
    webContents
        .executeJavaScript(
            `document.getElementsByTagName("ytmusic-player-bar")[0].getAttribute("repeat-mode_");`
        )
        .then((repeatType) => {
            debug(`Repeat type is: ${repeatType}`)
            player.repeatType = repeatType
        })
        .catch((_) => console.log('error getRepeatType'))
}

function getUrl(webContents) {
    webContents
        .executeJavaScript(
            `document.getElementsByClassName('ytp-title-link yt-uix-sessionlink')[0].href`
        )
        .then((url) => {
            if (url) {
                track.url = url

                var newUrl = new URL(url)
                var searchParams = new URLSearchParams(newUrl.search)

                track.id = searchParams.get('v')
                debug(`Track Url: ${track.url}`)
                debug(`Track id: ${track.id}`)
            }
        })
        .catch((_) => console.log('error getUrl'))
}

function getQueue(webContents) {
    webContents
        .executeJavaScript(
            `
            var element = document.querySelector('ytmusic-player-queue #contents')
            var children = element.children

            var arrChildren = Array.from(children)
            
            var queue = { automix: false, currentIndex: 0, data: [] };

            arrChildren.forEach( (el, key) => { 
                var songElement = el.querySelector('.song-info')

                var songCover = songElement.parentElement.querySelector('.yt-img-shadow').getAttribute('src')
                var songTitle = songElement.querySelector('.song-title').getAttribute('title')
                var songAuthor = songElement.querySelector('.byline').getAttribute('title')
                
                if(el.hasAttribute('selected')) {
                    queue.currentIndex = key;
                }
                text = { cover: songCover, title: songTitle, author: songAuthor }
                queue.data.push(text)
            } )

            queue.automix = document.querySelector('#automix').getAttribute('aria-pressed') == 'true'
            queue
            `
        )
        .then((queue) => {
            if (queue) {
                player.queue = queue
                debug(`Player Queue: ${player.queue}`)
            }
        })
        .catch((_) => console.log('error getQueue'))
}

function setQueueItem(webContents, index) {
    webContents.executeJavaScript(
        `
        var element = document.querySelector('ytmusic-player-queue #contents').children[${index}].querySelector('.song-info').parentElement.querySelector('.left-items .thumbnail-overlay #play-button').click()
        `
    )
}

function addToLibary(webContents) {
    webContents
        .executeJavaScript(
            `
            var popup = document.querySelector('.ytmusic-menu-popup-renderer');
            if (popup == null) {
                var middleControlsButtons = document.querySelector('.middle-controls-buttons');
                var dots = middleControlsButtons.children[1]

                var action = dots.querySelector('#button')

                action.click()
                action.click()
            }

            setTimeout( ()=> {
                var addLibrary = popup.children[3];
                addLibrary.click()
            }, 100)
            `
        )
        .then()
        .catch((_) => console.log('error addToLibary ' + _))
}

function isVideo(webContents) {
    webContents
        .executeJavaScript(
            `document.getElementById('player').hasAttribute('video-mode_')`
        )
        .then((isVideo) => {
            track.isVideo = !!isVideo
            debug(`Is video: ${track.isVideo}`)
        })
        .catch((_) => console.log('error isVideo ' + _))
}

function isAdvertisement(webContents) {
    webContents
        .executeJavaScript(
            `document.getElementsByClassName('advertisement ')[0].hasAttribute('hidden')`
        )
        .then((isAdvertisement) => {
            track.isAdvertisement = !isAdvertisement
            debug(`Is advertisement: ${track.isAdvertisement}`)
        })
        .catch((_) => console.log('error isAdvertisement'))
}

function setVolume(webContents, time) {
    webContents
        .executeJavaScript(
            `
        var slider = document.querySelector('#volume-slider');
        slider.value = ${time};
        `
        )
        .then()
        .catch((_) => console.log('error changeVolume'))
}

function setSeekbar(webContents, time) {
    webContents
        .executeJavaScript(
            `
        var slider = document.querySelectorAll('.bar-container .paper-slider')[2];
        var sliderKnob = document.querySelectorAll('#progress-bar')[0];

        slider.click();

        sliderKnob.value = ${time};
        `
        )
        .then()
        .catch((_) => console.log('error changeSeekbar'))
}

function setLyrics(provider, lyrics) {
    track.lyrics.provider = provider
    track.lyrics.data = lyrics
}

function inLibrary(webContents) {
    webContents
        .executeJavaScript(
            `
            var popup = document.querySelector('.ytmusic-menu-popup-renderer');
            if (popup == null) {
                var middleControlsButtons = document.querySelector('.middle-controls-buttons');
                var dots = middleControlsButtons.children[1]

                var action = dots.querySelector('#button')

                action.click()
                action.click()
            }

            var addLibrary = popup.children[3];
            var _g = addLibrary.querySelector('g')
            var _path = _g.querySelectorAll('path')[1];
            var _d = _path.getAttribute('d')

            _d == 'M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7.53 12L9 10.5l1.4-1.41 2.07 2.08L17.6 6 19 7.41 12.47 14zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z'
            `
        )
        .then((inLibrary) => {
            player.inLibrary = inLibrary
            debug(`In Library: ${player.inLibrary}`)
        })
        .catch((_) => console.log('error inLibrary'))
}

function convertToHuman(time) {
    var _aux = time
    var _minutes = 0
    var _seconds = 0

    while (_aux >= 60) {
        _aux = _aux - 60
        _minutes++
    }

    _seconds = _aux

    if (_seconds < 10) {
        return _minutes + ':0' + _seconds
    }
    return _minutes + ':' + _seconds
}

function setPercent(px, ptotal) {
    track.statePercent = px / ptotal
}

function hasInitialized() {
    return initialized
}

function firstPlay(webContents) {
    webContents
        .executeJavaScript(
            `
      var carousel = document.getElementsByClassName('carousel')[0];
      var firstChild = carousel.querySelector('#items').children[0];
      var playButton = firstChild.querySelector('#play-button')
      
      playButton.click();`
        )
        .then()
        .catch((_) => console.log('error firstPlay'))
}

function debug(data) {
    // console.log(data);
}

module.exports = {
    init: init,
    getAllInfo: getAllInfo,
    getPlayerInfo: getPlayerInfo,
    getTrackInfo: getTrackInfo,
    hasInitialized: hasInitialized,
    firstPlay: firstPlay,

    setVolume: setVolume,
    setSeekbar: setSeekbar,
    setLyrics: setLyrics,
    setQueueItem: setQueueItem,

    addToLibary: addToLibary,
}
