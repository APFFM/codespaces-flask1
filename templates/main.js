 // Global variables
 let alertList = [];
 let barChart, lineChart, pieChart, radarChart;
 
 // Function to fetch currency data from @fawazahmed0/currency-api
 async function fetchCurrencyData(startDate, endDate) {
     try {
         const baseUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@';
         const fallbackBaseUrl = 'https://{date}.currency-api.pages.dev/';
 
         const dateRange = getDateRange(startDate, endDate);
         const currencies = ['eur', 'jpy', 'gbp', 'aud', 'cad', 'chf', 'nzd', 'nok', 'sek'];
         const result = {
             dates: dateRange,
             data: {}
         };
 
         currencies.forEach(currency => {
             result.data[currency.toUpperCase()] = [];
         });
 
         for (let date of dateRange) {
             let url = `${baseUrl}${date}/currencies/usd.json`;
             let response = await fetch(url);
             if (!response.ok) {
                 url = `${fallbackBaseUrl.replace('{date}', date)}/v1/currencies/usd.json`;
                 response = await fetch(url);
                 if (!response.ok) {
                     console.warn(`Failed to fetch data for date ${date}, skipping...`);
                     continue;
                 }
             }
             const data = await response.json();
             currencies.forEach(currency => {
                 const rate = data.usd[currency];
                 result.data[currency.toUpperCase()].push(rate ? 1 / rate : null);
             });
         }
 
         return result;
     } catch (error) {
         console.error('Error fetching currency data:', error);
         alert('Failed to fetch currency data. Please try again later.');
         return null;
     }
 }
 
 function getDateRange(startDate, endDate) {
     const dateArray = [];
     let currentDate = new Date(startDate);
     const stopDate = new Date(endDate);
     while (currentDate <= stopDate) {
         dateArray.push(currentDate.toISOString().split('T')[0]);
         currentDate.setDate(currentDate.getDate() + 1);
     }
     return dateArray;
 }
 
 async function updateCharts() {
     const startDate = document.getElementById('startDate').value;
     const endDate = document.getElementById('endDate').value;
     const currencyData = await fetchCurrencyData(startDate, endDate);
 
     if (!currencyData || Object.keys(currencyData.data).length === 0) {
         alert('No data available for the selected date range. Please try a different range.');
         return;
     }
 
     // Update Bar Chart with latest data
     const latestData = Object.keys(currencyData.data).map(key => {
         const dataArray = currencyData.data[key];
         return dataArray[dataArray.length - 1];
     });
     barChart.data.labels = Object.keys(currencyData.data);
     barChart.data.datasets[0].data = latestData;
     barChart.update();
 
     // Update Line Chart
     lineChart.data.labels = currencyData.dates;
     lineChart.data.datasets.forEach(dataset => {
         dataset.data = currencyData.data[dataset.label];
     });
     lineChart.update();
 
     // Update Pie Chart with average data
     const averageData = Object.keys(currencyData.data).map(key => {
         const dataArray = currencyData.data[key];
         const sum = dataArray.reduce((a, b) => a + b, 0);
         return sum / dataArray.length;
     });
     pieChart.data.labels = Object.keys(currencyData.data);
     pieChart.data.datasets[0].data = averageData;
     pieChart.update();
 
     // Update Radar Chart with maximum data
     const maxData = Object.keys(currencyData.data).map(key => {
         return Math.max(...currencyData.data[key]);
     });
     radarChart.data.labels = Object.keys(currencyData.data);
     radarChart.data.datasets[0].data = maxData;
     radarChart.update();
 
     // Check alerts
     checkAlerts(Object.fromEntries(Object.keys(currencyData.data).map((key, index) => [key, latestData[index]])));
 
     // Update last updated timestamp
     document.querySelector('#lastUpdated span').textContent = new Date().toLocaleString();
 
     // Add Volatility to Bar Chart
     const volatilityPeriod = 10;
     const volatility = calculateVolatility(latestData, volatilityPeriod);
     barChart.data.datasets.push({
         label: `${volatilityPeriod}-day Volatility`,
         data: volatility,
         type: 'line',
         borderColor: 'rgba(255, 99, 132, 1)',
         borderWidth: 2,
         fill: false,
         yAxisID: 'y1'
     });
     barChart.options.scales.y1 = {
         type: 'linear',
         display: true,
         position: 'right',
         grid: {
             drawOnChartArea: false,
         },
     };
     barChart.update();
 }
 
 function calculateVolatility(data, period) {
     const volatility = [];
     for (let i = period; i < data.length; i++) {
         const slice = data.slice(i - period, i);
         const mean = slice.reduce((a, b) => a + b, 0) / period;
         const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
         volatility.push(Math.sqrt(variance));
     }
     return volatility;
 }
 
 // Initialize Charts
 function initializeCharts() {
     const barCtx = document.getElementById('currencyChart').getContext('2d');
     barChart = new Chart(barCtx, {
         type: 'bar',
         data: {
             labels: [],
             datasets: [{
                 label: 'Latest Exchange Rate to USD',
                 data: [],
                 backgroundColor: 'rgba(70, 130, 180, 0.7)'
             }]
         },
         options: {
             responsive: true,
             scales: {
                 y: {
                     beginAtZero: false,
                     ticks: { color: '#FFFFFF' },
                     grid: { color: '#444' }
                 },
                 x: {
                     ticks: { color: '#FFFFFF' },
                     grid: { color: '#444' }
                 }
             },
             plugins: {
                 legend: { labels: { color: '#FFFFFF' } },
                 zoom: {
                     wheel: { enabled: true },
                     drag: { enabled: true },
                     pinch: { enabled: true },
                     mode: 'x'
                 }
             }
         }
     });
 
     const lineCtx = document.getElementById('currencyLineChart').getContext('2d');
     lineChart = new Chart(lineCtx, {
         type: 'line',
         data: {
             labels: [],
             datasets: ['EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'NZD', 'NOK', 'SEK'].map((currency, index) => ({
                 label: currency,
                 data: [],
                 borderColor: `hsl(${index * 36}, 100%, 50%)`,
                 fill: false
             }))
         },
         options: {
             responsive: true,
             scales: {
                 y: {
                     ticks: { color: '#FFFFFF' },
                     grid: { color: '#444' }
                 },
                 x: {
                     ticks: { color: '#FFFFFF' },
                     grid: { color: '#444' }
                 }
             },
             plugins: {
                 legend: { labels: { color: '#FFFFFF' } },
                 zoom: {
                     wheel: { enabled: true },
                     drag: { enabled: true },
                     pinch: { enabled: true },
                     mode: 'x'
                 }
             }
         }
     });
 
     const pieCtx = document.getElementById('currencyPieChart').getContext('2d');
     pieChart = new Chart(pieCtx, {
         type: 'pie',
         data: {
             labels: [],
             datasets: [{
                 data: [],
                 backgroundColor: ['EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'NZD', 'NOK', 'SEK'].map((_, index) => `hsl(${index * 36}, 70%, 50%)`)
             }]
         },
         options: {
             responsive: true,
             plugins: {
                 legend: { labels: { color: '#FFFFFF' } }
             }
         }
     });
 
     const radarCtx = document.getElementById('currencyRadarChart').getContext('2d');
     radarChart = new Chart(radarCtx, {
         type: 'radar',
         data: {
             labels: [],
             datasets: [{
                 label: 'Maximum Exchange Rate',
                 data: [],
                 backgroundColor: 'rgba(179,181,198,0.2)',
                 borderColor: 'rgba(179,181,198,1)'
             }]
         },
         options: {
             responsive: true,
             scales: {
                 r: {
                     ticks: { color: '#FFFFFF' },
                     grid: { color: '#444' },
                     pointLabels: { color: '#FFFFFF' }
                 }
             },
             plugins: {
                 legend: { labels: { color: '#FFFFFF' } }
             }
         }
     });
 }
 
 // AI Chatbot Functionality
 function initializeChatbot() {
     const chatDisplay = document.getElementById('chatDisplay');
     const userInput = document.getElementById('userInput');
     const sendButton = document.getElementById('sendButton');
 
     sendButton.addEventListener('click', () => {
         const userMessage = userInput.value.trim();
         if (userMessage !== '') {
             displayMessage(userMessage, 'user');
             getBotResponse(userMessage);
             userInput.value = '';
         }
     });
 
     userInput.addEventListener('keypress', (e) => {
         if (e.key === 'Enter') {
             sendButton.click();
         }
     });
 
     function displayMessage(message, sender) {
         const messageDiv = document.createElement('div');
         messageDiv.className = 'chat-message';
         messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
         messageDiv.textContent = `${sender === 'user' ? 'You: ' : 'Bot: '}${message}`;
         chatDisplay.appendChild(messageDiv);
         chatDisplay.scrollTop = chatDisplay.scrollHeight;
     }
 
     function getBotResponse(message) {
         // Simple keyword-based responses
         let response = '';
         if (message.toLowerCase().includes('usd')) {
             response = 'The USD is currently strong due to economic recovery.';
         } else if (message.toLowerCase().includes('eur')) {
             response = 'The EUR has been experiencing some weakness recently.';
         } else if (message.toLowerCase().includes('chart')) {
             response = 'Our dashboard provides various charts including bar, line, pie, and radar charts.';
         } else if (message.toLowerCase().includes('aud')) {
             response = 'The AUD is influenced by commodity prices and trade relations.';
         } else if (message.toLowerCase().includes('help')) {
             response = 'You can ask me about specific currencies, charts, or recent news.';
         } else if (message.toLowerCase().includes('set alert')) {
             response = 'To set an alert, navigate to the Alerts section and enter your criteria.';
         } else {
             response = 'I am here to provide information about G10 currencies. Ask me about USD, EUR, JPY, charts, etc.';
         }
         setTimeout(() => {
             displayMessage(response, 'bot');
         }, 500);
     }
 }
 
 // Alert System
 function initializeAlertSystem() {
     document.getElementById('setAlertButton').addEventListener('click', () => {
         const currency = document.getElementById('currencySelect').value.toUpperCase();
         const threshold = parseFloat(document.getElementById('threshold').value);
         if (isNaN(threshold)) {
             alert('Please enter a valid threshold value.');
             return;
         }
         alertList.push({ currency, threshold });
         alert('Alert set for ' + currency + ' when it reaches ' + threshold);
     });
 }
 
 function checkAlerts(latestData) {
     const alertMessages = document.getElementById('alertMessages');
     alertMessages.innerHTML = '';
     alertList.forEach(alert => {
         const currentRate = latestData[alert.currency];
         if (currentRate >= alert.threshold) {
             const message = document.createElement('div');
             message.textContent = `${alert.currency} has reached ${currentRate.toFixed(4)}, exceeding your threshold of ${alert.threshold}.`;
             alertMessages.appendChild(message);
         }
     });
 }
 
 // Dark Mode Toggle
 function initializeDarkModeToggle() {
     const darkModeToggle = document.getElementById('darkModeToggle');
     const body = document.body;
 
     darkModeToggle.addEventListener('click', () => {
         body.classList.toggle('dark-mode');
         const isDarkMode = body.classList.contains('dark-mode');
         darkModeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i> Light Mode' : '<i class="fas fa-moon"></i> Dark Mode';
     });
 }
 
 // Initialize everything when the DOM is loaded
 document.addEventListener('DOMContentLoaded', () => {
     initializeCharts();
     initializeChatbot();
     initializeAlertSystem();
     initializeDarkModeToggle();
     initializeCurrencyConverter();
     initializeNewsSection();
 
     // Set default date range (e.g., last 30 days)
     const endDate = new Date();
     const startDate = new Date();
     startDate.setDate(startDate.getDate() - 30);
     
     document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
     document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
     
     // Update charts on date change
     document.getElementById('updateButton').addEventListener('click', updateCharts);
 
     // Initial update
     updateCharts();
 });
 
 function initializeCurrencyConverter() {
     const converterContainer = document.createElement('div');
     converterContainer.id = 'currencyConverter';
     converterContainer.innerHTML = `
         <h2>Currency Converter</h2>
         <input type="number" id="converterAmount" placeholder="Amount">
         <select id="fromCurrency">
             ${['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'NZD', 'NOK', 'SEK'].map(curr => `<option value="${curr}">${curr}</option>`).join('')}
         </select>
         <select id="toCurrency">
             ${['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'NZD', 'NOK', 'SEK'].map(curr => `<option value="${curr}">${curr}</option>`).join('')}
         </select>
         <button id="convertButton">Convert</button>
         <p id="conversionResult"></p>
     `;
     document.getElementById('mainContent').appendChild(converterContainer);
 
     document.getElementById('convertButton').addEventListener('click', async () => {
         const amount = document.getElementById('converterAmount').value;
         const from = document.getElementById('fromCurrency').value;
         const to = document.getElementById('toCurrency').value;
         const rate = await fetchExchangeRate(from, to);
         const result = (amount * rate).toFixed(4);
         document.getElementById('conversionResult').textContent = `${amount} ${from} = ${result} ${to}`;
     });
 }
 
 async function fetchExchangeRate(from, to) {
     const response = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${from.toLowerCase()}.json`);
     const data = await response.json();
     return data[from.toLowerCase()][to.toLowerCase()];
 }
 
 // Replace the fetchForexNews function with this mock version
 async function fetchForexNews(currency = '') {
     console.log('Using mock news data due to API restrictions');
     // Mock news data
     const mockNews = [
         {
             title: "USD strengthens amid economic recovery",
             description: "The US dollar has shown strength as economic indicators point to a robust recovery.",
             url: "#"
         },
         {
             title: "EUR faces challenges with new policy decisions",
             description: "The Euro is experiencing volatility as the European Central Bank considers new monetary policies.",
             url: "#"
         },
         {
             title: "JPY stable despite market fluctuations",
             description: "The Japanese Yen remains a safe-haven currency amidst global market uncertainties.",
             url: "#"
         },
         {
             title: "GBP rallies on positive trade negotiations",
             description: "The British Pound sees gains as trade talks show promising developments.",
             url: "#"
         },
         {
             title: "AUD affected by commodity price changes",
             description: "The Australian Dollar fluctuates as global commodity prices shift.",
             url: "#"
         }
     ];
 
     // Filter news based on currency if provided
     if (currency) {
         return mockNews.filter(news => news.title.includes(currency) || news.description.includes(currency));
     }
     return mockNews;
 }
 
 function initializeNewsSection() {
     const newsContainer = document.getElementById('newsContainer');
     const currencySelect = document.createElement('select');
     currencySelect.id = 'newsCurrencySelect';
     currencySelect.innerHTML = `
         <option value="">All Currencies</option>
         ${['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'NZD', 'NOK', 'SEK'].map(curr => `<option value="${curr}">${curr}</option>`).join('')}
     `;
     
     const fetchNewsButton = document.createElement('button');
     fetchNewsButton.textContent = 'Fetch News';
     fetchNewsButton.id = 'fetchNewsButton';
     
     newsContainer.insertBefore(fetchNewsButton, newsContainer.firstChild);
     newsContainer.insertBefore(currencySelect, newsContainer.firstChild);
     
     fetchNewsButton.addEventListener('click', () => {
         const selectedCurrency = currencySelect.value;
         updateNews(selectedCurrency);
     });
 }
 
 // Update the updateNews function
 async function updateNews(currency = '') {
     const newsLoading = document.getElementById('newsLoading');
     const newsFeed = document.getElementById('newsFeed');
     
     newsLoading.style.display = 'block';
     newsFeed.innerHTML = '';
     
     try {
         const articles = await fetchForexNews(currency);
         newsLoading.style.display = 'none';
         if (articles.length > 0) {
             displayNews(articles);
         } else {
             newsFeed.innerHTML = '<p>No news articles available for the selected currency. Please try another currency or check back later.</p>';
         }
     } catch (error) {
         console.error('Error updating news:', error);
         newsLoading.style.display = 'none';
         newsFeed.innerHTML = '<p>Failed to load news. Please try again later.</p>';
     }
 }
 
 // Update the displayNews function
 function displayNews(articles) {
     const newsFeed = document.getElementById('newsFeed');
     newsFeed.innerHTML = ''; // Clear existing content
     if (articles.length === 0) {
         newsFeed.innerHTML = '<p>No news articles available at the moment.</p>';
         return;
     }
     articles.forEach(article => {
         const newsItem = document.createElement('div');
         newsItem.className = 'news-item';
         newsItem.innerHTML = `
             <h3><a href="${article.url}" target="_blank">${article.title}</a></h3>
             <p>${article.description || 'No description available.'}</p>
         `;
         newsFeed.appendChild(newsItem);
     });
 }
 
 function addExportButton() {
     const exportButton = document.createElement('button');
     exportButton.textContent = 'Export Data';
     exportButton.id = 'exportButton';
     document.getElementById('mainContent').appendChild(exportButton);
 
     exportButton.addEventListener('click', () => {
         const csvContent = "data:text/csv;charset=utf-8," 
             + Object.keys(currencyData.data).join(",") + "\n"
             + currencyData.dates.map((date, i) => {
                 return date + "," + Object.values(currencyData.data).map(arr => arr[i]).join(",");
             }).join("\n");
 
         const encodedUri = encodeURI(csvContent);
         const link = document.createElement("a");
         link.setAttribute("href", encodedUri);
         link.setAttribute("download", "forex_data.csv");
         document.body.appendChild(link);
         link.click();
     });
 }
 
 // Add this to the DOMContentLoaded event listener
 addExportButton();