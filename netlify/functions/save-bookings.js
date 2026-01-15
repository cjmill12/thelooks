<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LOOKS | AI Virtual Try-On</title>
    
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <link rel="stylesheet" type="text/css" href="https://npmcdn.com/flatpickr/dist/themes/dark.css">
    
    <style>
        :root {
            --accent: #e63946;
            --bg: #0f0f0f;
            --card: #1a1a1a;
            --text: #ffffff;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: var(--bg);
            color: var(--text);
            margin: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
        }

        .container {
            width: 100%;
            max-width: 500px;
            padding: 20px;
            box-sizing: border-box;
        }

        header {
            text-align: center;
            margin-bottom: 30px;
            padding-top: 20px;
        }

        .logo {
            font-size: 2.5rem;
            font-weight: 900;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            margin: 0;
        }

        /* The Hero Display */
        #try-on-display {
            width: 100%;
            aspect-ratio: 1/1;
            background: var(--card);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            border: 1px solid #333;
            margin-bottom: 25px;
            position: relative;
        }

        #try-on-display img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .primary-btn {
            width: 100%;
            padding: 18px;
            background-color: var(--accent);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.1s;
        }

        .primary-btn:active { transform: scale(0.98); }

        /* Booking Modal */
        #booking-modal {
            display: none;
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.95);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }

        .modal-content {
            background: var(--card);
            width: 90%;
            max-width: 400px;
            padding: 30px;
            border-radius: 24px;
            border: 1px solid #333;
        }

        h2 { margin-top: 0; font-weight: 800; }

        input, select {
            width: 100%;
            padding: 14px;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 8px;
            color: white;
            box-sizing: border-box;
            margin-bottom: 15px;
            font-size: 1rem;
        }

        .submit-btn {
            width: 100%;
            padding: 16px;
            background: white;
            color: black;
            border: none;
            border-radius: 12px;
            font-weight: 800;
            cursor: pointer;
            text-transform: uppercase;
        }

        #status-msg { text-align: center; margin-top: 15px; font-size: 0.9rem; }
    </style>
</head>
<body>

<div class="container">
    <header>
        <div class="logo">LOOKS</div>
    </header>

    <div id="try-on-display">
        <img id="ai-result-img" src="placeholder.jpg" alt="AI Preview"> 
    </div>

    <button id="open-booking-btn" class="primary-btn">Book This Style Now</button>
</div>

<div id="booking-modal">
    <div class="modal-content">
        <h2>Confirm Booking</h2>
        
        <input type="text" id="booking-date" placeholder="Select Date">
        <select id="booking-time">
            <option value="">Select a time</option>
        </select>
        <input type="text" id="client-name" placeholder="Your Name">
        <input type="email" id="client-email" placeholder="Email Address">

        <button id="final-confirm-btn" class="submit-btn">Complete Appointment</button>
        <div id="status-msg"></div>
        
        <button onclick="document.getElementById('booking-modal').style.display='none'" style="background:none; border:none; color:#888; width:100%; margin-top:15px; cursor:pointer;">Cancel</button>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
<script>
    // 1. Initialize Calendar
    flatpickr("#booking-date", {
        minDate: "today",
        theme: "dark",
        onChange: function(selectedDates, dateStr) {
            const timeSelect = document.getElementById('booking-time');
            timeSelect.innerHTML = '<option value="">Choose a time...</option>';
            // Mock slots
            const slots = ["09:00", "11:00", "13:00", "15:00"];
            slots.forEach(s => {
                const el = document.createElement('option');
                el.value = s; el.textContent = s;
                timeSelect.appendChild(el);
            });
        }
    });

    // 2. Modal Toggle
    document.getElementById('open-booking-btn').onclick = () => {
        document.getElementById('booking-modal').style.display = 'flex';
    };

    // 3. Form Submission
    document.getElementById('final-confirm-btn').onclick = async () => {
        const status = document.getElementById('status-msg');
        status.textContent = "Processing...";

        const bookingData = {
            name: document.getElementById('client-name').value,
            email: document.getElementById('client-email').value,
            date: document.getElementById('booking-date').value,
            time: document.getElementById('booking-time').value,
            image: document.getElementById('ai-result-img').src
        };

        try {
            const response = await fetch('/.netlify/functions/save-booking', {
                method: 'POST',
                body: JSON.stringify(bookingData)
            });

            if (response.ok) {
                status.style.color = "#4BB543";
                status.textContent = "Booking Confirmed!";
                setTimeout(() => document.getElementById('booking-modal').style.display = 'none', 2000);
            } else {
                status.textContent = "Error saving booking.";
            }
        } catch (e) {
            status.textContent = "Connection error.";
        }
    };
</script>

</body>
</html>
