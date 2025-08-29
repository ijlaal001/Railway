from flask import Flask, render_template, jsonify, request
import random
from datetime import datetime, timedelta

app = Flask(__name__)

# Mock data for trains
MOCK_TRAINS = [
    {"number": "12345", "name": "Rajdhani Express", "departure": "06:00", "arrival": "14:30", "duration": "8h 30m"},
    {"number": "22691", "name": "Shatabdi Express", "departure": "07:15", "arrival": "12:45", "duration": "5h 30m"},
    {"number": "12002", "name": "New Delhi Shatabdi", "departure": "08:00", "arrival": "13:15", "duration": "5h 15m"},
    {"number": "12951", "name": "Mumbai Rajdhani", "departure": "16:55", "arrival": "08:35", "duration": "15h 40m"},
    {"number": "12626", "name": "Kerala Express", "departure": "11:45", "arrival": "04:15", "duration": "16h 30m"},
]

# Mock PNR statuses
PNR_STATUSES = ["Confirmed", "RAC 25", "WL 45", "Cancelled", "Chart Prepared"]

# Mock live statuses
LIVE_STATUSES = ["On Time", "Running Late by 15 mins", "Running Late by 45 mins", "Cancelled", "Departed"]

# Route handlers for pages
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/pnr')
def pnr():
    return render_template('pnr.html')

@app.route('/status')
def status():
    return render_template('status.html')

@app.route('/favorites')
def favorites():
    return render_template('favorites.html')

# API endpoints
@app.route('/search_trains')
def search_trains():
    from_station = request.args.get('from', '').strip()
    to_station = request.args.get('to', '').strip()
    
    if not from_station or not to_station:
        return jsonify({"error": "Both from and to stations are required"}), 400
    
    # Return mock train data with station info
    trains = []
    for train in MOCK_TRAINS:
        train_copy = train.copy()
        train_copy['from'] = from_station
        train_copy['to'] = to_station
        train_copy['date'] = datetime.now().strftime('%Y-%m-%d')
        trains.append(train_copy)
    
    return jsonify({"trains": trains})

@app.route('/pnr_status')
def pnr_status():
    pnr = request.args.get('pnr', '').strip()
    
    if not pnr:
        return jsonify({"error": "PNR number is required"}), 400
    
    if len(pnr) != 10:
        return jsonify({"error": "PNR must be 10 digits"}), 400
    
    # Mock PNR status response
    status = random.choice(PNR_STATUSES)
    train = random.choice(MOCK_TRAINS)
    
    return jsonify({
        "pnr": pnr,
        "status": status,
        "train_number": train["number"],
        "train_name": train["name"],
        "date": datetime.now().strftime('%Y-%m-%d'),
        "from": "New Delhi",
        "to": "Mumbai Central",
        "class": "3A",
        "seat": "S1/25" if status == "Confirmed" else None
    })

@app.route('/live_status')
def live_status():
    train_number = request.args.get('train', '').strip()
    
    if not train_number:
        return jsonify({"error": "Train number is required"}), 400
    
    # Find train or use first one as fallback
    train = next((t for t in MOCK_TRAINS if t["number"] == train_number), MOCK_TRAINS[0])
    
    status = random.choice(LIVE_STATUSES)
    current_station = random.choice(["New Delhi", "Ghaziabad", "Aligarh", "Kanpur", "Allahabad", "Varanasi"])
    
    return jsonify({
        "train_number": train_number,
        "train_name": train["name"],
        "status": status,
        "current_station": current_station,
        "last_updated": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "next_station": "Lucknow Junction",
        "scheduled_arrival": "14:30",
        "expected_arrival": "14:45"
    })

@app.route('/fare_info')
def fare_info():
    train_number = request.args.get('train', '').strip()
    
    if not train_number:
        return jsonify({"error": "Train number is required"}), 400
    
    # Mock fare data
    fares = {
        "SL": random.randint(200, 500),
        "3A": random.randint(600, 1200),
        "2A": random.randint(1000, 2000),
        "1A": random.randint(1800, 3500)
    }
    
    return jsonify({
        "train_number": train_number,
        "fares": fares,
        "currency": "INR"
    })

@app.route('/seat_availability')
def seat_availability():
    train_number = request.args.get('train', '').strip()
    
    if not train_number:
        return jsonify({"error": "Train number is required"}), 400
    
    # Mock availability data
    availability = {
        "SL": {"available": random.randint(0, 50), "waiting": random.randint(0, 100)},
        "3A": {"available": random.randint(0, 20), "waiting": random.randint(0, 50)},
        "2A": {"available": random.randint(0, 15), "waiting": random.randint(0, 30)},
        "1A": {"available": random.randint(0, 10), "waiting": random.randint(0, 20)}
    }
    
    return jsonify({
        "train_number": train_number,
        "date": datetime.now().strftime('%Y-%m-%d'),
        "availability": availability
    })

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)