const urlSearchParams = new URLSearchParams(window.location.search);
const urlParams = Object.fromEntries(urlSearchParams.entries());
var params;

function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}  

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

async function getTokens() {
    return await fetch("https://accounts.spotify.com/api/token", {
        body: "grant_type=authorization_code&code=" + urlParams["code"] + "&redirect_uri=https%3A%2F%2Fhandwritify.netlify.app%2F",
        // body: "grant_type=authorization_code&code=" + urlParams["code"] + "&redirect_uri=http%3A%2F%2F192.168.1.7%3A8000%2F",
        headers: {
            "Authorization": "Basic Y2MxODBhZWQwMWY4NDExMDlkMTFjYjVjOTA0N2Y5NWI6NDFiZWFlZDQ5ZDZmNGEwOWFmMTQzNDZmYmVlNDVjYWE=",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        method: "POST"
    })
    .then(response => response.json())
    .then(data => {
        if (!Object.keys(data).includes("error")) {
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("refresh_token", data.refresh_token);
            return data
        } else {
            return false;
        }
    });
}

async function refreshTokens() {
    return await fetch("https://accounts.spotify.com/api/token", {
        body: "grant_type=refresh_token&refresh_token=" + localStorage.refresh_token,
        headers: {
            "Authorization": "Basic Y2MxODBhZWQwMWY4NDExMDlkMTFjYjVjOTA0N2Y5NWI6NDFiZWFlZDQ5ZDZmNGEwOWFmMTQzNDZmYmVlNDVjYWE=",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        method: "POST"
    })
    .then(response => response.json())
}

async function authenticate() {
    params = await getTokens();
    if (!params) {
        params = await refreshTokens();
    }
}

if (Object.keys(urlParams).includes("code")) {
    document.getElementById("login").style.display = "none";
    document.getElementById("loggedin").style.display = "initial";
    // document.getElementById("header").classList.add("vh-100");
    authenticate();
} else {
    document.getElementById("loggedin").style.display = "none";
    document.getElementById("login").style.display = "initial";  
    // document.getElementById("header").classList.remove("vh-100");
}

const time_period_selected = document.getElementsByClassName("time-period-selected");

for (var i = 0; i < time_period_selected.length; i++) {
    time_period_selected[i].style.display="none";
}

var bias_slider = new Slider('#bias', {
    formatter: function(value) {
        return 'Current value: ' + value;
    }
});

var width_slider = new Slider('#width', {
    formatter: function(value) {
        return 'Current value: ' + value;
    }
});


async function getTracklist(term) {
    const time_period_selected = document.getElementsByClassName("time-period-selected");

    // var tracklist_table = document.getElementById('tracklist-table');

    document.getElementById('tracklist').innerHTML = '<canvas id="canvas" width="360" height="640"></canvas>';
    document.getElementById('canvas').style.display="none";

    var table = document.createElement('table');
    table.id = 'tracklist-table';
    var tr = document.createElement('tr');

    var artist = document.createElement('th');
    artist.innerHTML = 'Artist';
    var name = document.createElement('th');
    name.innerHTML = 'Song';
    var duration = document.createElement('th');
    duration.innerHTML = 'Duration';    

    tr.appendChild(artist);
    tr.appendChild(name);
    tr.appendChild(duration);

    table.appendChild(tr);

    table.style.display = "none";

    document.getElementById('tracklist').appendChild(table);
    

    var tracklist = [];

    var tracks = [];

    for (var i = 0; i < time_period_selected.length; i++) {
        time_period_selected[i].style.display="initial";
    }

    await fetch("https://api.spotify.com/v1/me/top/tracks?time_range=" + term, {
        headers: {
            accept: "application/json",
            authorization: "Bearer " + params["access_token"],
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(data => {
        data.items.forEach(
            item => {
                tracks.push(item.name + " - " + item.artists[0].name)
                tracklist.push({
                    "artist": item.artists[0].name,
                    "name": item.name,
                    "duration": millisToMinutesAndSeconds(item.duration_ms)
                });
            }
        );
    });

    // console.log(tracks);
    localStorage.setItem("tracks", JSON.stringify(tracks));
    
    for (var i = 0; i < tracklist.length; i++) {
        var artist = document.createElement('td');
        artist.innerHTML = tracklist[i].artist;
        var name = document.createElement('td');
        name.innerHTML = tracklist[i].name;
        var duration = document.createElement('td');
        duration.innerHTML = tracklist[i].duration;
        
        var tr = document.createElement('tr');

        artist.classList.add("px-2");
        name.classList.add("px-2");
        duration.classList.add("px-2");

        tr.appendChild(artist);
        tr.appendChild(name);
        tr.appendChild(duration);

        document.getElementById('tracklist-table').appendChild(tr);
    }

    table.style.display = "initial";

    document.getElementById("instruction").innerHTML = "Select Bias and Stroke Width"
}

async function getArtwork() {

    document.getElementById("instruction").innerHTML = "Loading..."

    const bias = document.getElementById("bias").value;
    const width = document.getElementById("width").value;
    const font_color = document.getElementById("font-color").value;
    const bg_color = document.getElementById("bg-color").value;
    
    if (!localStorage.tracks) {
        return false;
    }

    const data = {
        "lines": JSON.parse(localStorage.tracks),
        "bias": bias,
        "width": width,
        "font_color": font_color,
        "bg_color": bg_color,
    }

    // console.log(data)

    // await fetch("http://127.0.0.1:5000/", {
    // await fetch("http://localhost:5000/", {
    await fetch("https://handwritify.herokuapp.com/", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(r => r.text())
    .then(data => {

        // console.log(data)

        document.getElementById('tracklist').innerHTML = '<canvas id="canvas" width="360" height="640" style="cursor: pointer"></canvas>';
        document.getElementById('canvas').addEventListener('click', function() { 
            var link = document.createElement('a');
            link.download = 'handwritify.png';
            link.href = canvas.toDataURL().replace("image/png", "image/octet-stream");
            link.click();
            // var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            // window.location.href=image;

            window.location.href = "instagram://story-camera"
         }, false);



        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        var DOMURL = self.URL || self.webkitURL || self;
        var img = new Image();
        var svg = new Blob([data], {type: "image/svg+xml;charset=utf-8"});
        var url = DOMURL.createObjectURL(svg)
        img.onload = function() {
            ctx.drawImage(img, 0, 0);
            var png = canvas.toDataURL("image/png")
            DOMURL.revokeObjectURL(png);
        }
        img.src = url;



        if (data.length < 300) {
            document.getElementById("tracklist").innerHTML = "Oops! One or more of your songs has unsupported characters!"
            document.getElementById("instruction").innerHTML = "Sorry!"
        }
    })

    document.getElementById("instruction").innerHTML = "Enjoy!"

    // .then(svg => document.body.insertAdjacentHTML("afterbegin", svg));
}