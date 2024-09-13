from flask import Flask, jsonify, request, render_template, send_from_directory
import yfinance as yf
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/news')
def get_news():
    currency = request.args.get('currency', default='', type=str)
    if currency:
        ticker = f"{currency}=X"
    else:
        ticker = "^GSPC"  # S&P 500 as a default for general market news
    
    stock = yf.Ticker(ticker)
    news = stock.news
    
    formatted_news = [
        {
            "title": item['title'],
            "description": item.get('summary', 'No description available.'),
            "url": item['link']
        } for item in news
    ]
    
    return jsonify(formatted_news)

if __name__ == '__main__':
    app.run(debug=True)