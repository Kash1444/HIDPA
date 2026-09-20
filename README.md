# HIDPA — DrainGuard AI

**Trustworthy AI-Powered IoT Drainage Intelligence Platform**

HIDPA is an AI-enabled IoT platform for monitoring drainage systems, detecting potential blockages, assessing water accumulation, evaluating sensor reliability, and providing actionable drainage health information.

The system combines an **ESP32-based drainage monitoring node**, **Blynk IoT telemetry**, a **FastAPI backend**, and a **React/Vite dashboard**.

![HIDPA dashboard](https://github.com/Kash1444/HIDPA/blob/aaa38f606d63c580e2faa4ab29cf2fc6bf49b8c0/Photos%26Videos/Screenshot%202026-09-20%20182435.png)

> **HIDPA** is the new development repository for the DrainGuard AI system. The previous project repository remains separate.

---

## Overview

Urban drainage blockages can cause water accumulation and flooding, particularly during heavy rainfall. Traditional monitoring systems often depend only on threshold-based alerts.

HIDPA extends this approach by combining:

* Real-time IoT telemetry
* Flow comparison
* Water-level monitoring
* Pump status
* Sensor health analysis
* Rule-based diagnosis
* Machine-learning-based prediction
* Data history and analytics
* Alerts and maintenance information
* Interactive monitoring dashboard
* Digital twin and simulation capabilities

The objective is to provide a **trustworthy decision-support system** while keeping the embedded safety logic on the ESP32 independent from the AI layer.

---

## System Architecture

```text
                    ┌──────────────────────┐
                    │      Drainage        │
                    │     Demonstration    │
                    │       System         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │        ESP32         │
                    │                      │
                    │ • Flow Sensors       │
                    │ • Ultrasonic Sensor  │
                    │ • Relay / Pump       │
                    │ • LEDs / Buzzer      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     Blynk Cloud      │
                    │      Telemetry       │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    FastAPI Backend   │
                    │                      │
                    │ • Data ingestion     │
                    │ • Diagnosis          │
                    │ • Sensor health      │
                    │ • AI prediction      │
                    │ • Alerts             │
                    │ • Analytics           │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   React Dashboard    │
                    │                      │
                    │ • Overview           │
                    │ • Diagnostics        │
                    │ • Analytics          │
                    │ • Drain Health       │
                    │ • Alerts             │
                    │ • Sensor Data        │
                    │ • Experiments        │
                    │ • Digital Twin       │
                    │ • Simulation         │
                    └──────────────────────┘
```

---

## Key Features

### Real-Time Drainage Monitoring

The system monitors:

* Flow Sensor 1
* Flow Sensor 2
* Flow difference
* Flow ratio
* Water level
* Pump status
* Full-level event count
* Drainage status
* Sensor health

### Blockage Detection

The embedded system uses flow comparison to identify abnormal downstream flow.

The current firmware rule detects a potential blockage when:

```text
Flow 1 ≥ 20
AND
Flow 1 − Flow 2 ≥ 15
FOR approximately 3 seconds
```

The AI/backend layer can then provide additional diagnosis and confidence information.

### Water Accumulation Monitoring

Water level is converted into a percentage based on calibrated ultrasonic distance measurements.

The system tracks increasing water accumulation and provides escalating warning states.

### Sensor Health

The platform does not automatically interpret every abnormal reading as a blockage.

It can distinguish between conditions such as:

```text
HEALTHY
WARNING
SUSPECTED FAULT
OFFLINE
UNCERTAIN
```

This is particularly important when one sensor becomes disconnected or produces unreliable data.

### AI-Assisted Diagnosis

The backend supports:

* Rule-based diagnosis
* Machine-learning prediction
* Risk estimation
* Confidence estimation
* Sensor reliability
* Severity assessment
* Recommended action

Supported diagnosis states include:

```text
NORMAL
DEVELOPING BLOCKAGE
BLOCKAGE
CRITICAL WATER ACCUMULATION
SENSOR FAULT
UNCERTAIN
```

The system uses a rule-based fallback when a validated machine-learning model is not available.

---

# Hardware

The prototype uses an ESP32-based monitoring node.

### Main Components

| Component                  | Purpose                      |
| -------------------------- | ---------------------------- |
| ESP32 DevKit V1            | Main controller              |
| AJ-SR04M Ultrasonic Sensor | Water-level measurement      |
| ZJ-S201 Flow Sensor ×2     | Flow monitoring              |
| Relay Module               | Pump control                 |
| AC Cooler Pump             | Water circulation            |
| Buzzer                     | Audible warning              |
| LEDs                       | Visual status indication     |
| Blynk IoT                  | Remote telemetry and control |

### ESP32 Pin Configuration

| Component       | GPIO |
| --------------- | ---: |
| Ultrasonic TRIG |   27 |
| Ultrasonic ECHO |   26 |
| Flow Sensor 1   |   32 |
| Flow Sensor 2   |   33 |
| Buzzer          |   22 |
| Blue LED        |   25 |
| Green LED       |   19 |
| Yellow LED      |   21 |
| Red LED         |   18 |
| Relay           |   23 |

The ultrasonic sensor uses an appropriate voltage-divider arrangement on the ESP32 echo input.

---

# Water-Level Logic

The prototype uses calibrated ultrasonic distances.

```text
EMPTY_DISTANCE = 27.75 cm
FULL_DISTANCE  = 20.49 cm
```

The measured distance is converted into a water-level percentage.

The embedded system uses increasing water-level ranges to provide progressively stronger warnings.

| Water Level | Status           |
| ----------: | ---------------- |
|       0–30% | Normal           |
|      30–60% | Warning          |
|      60–80% | High             |
|      80–90% | Critical warning |
|     90–<99% | Severe           |
|        ≥99% | Critical         |

At the critical threshold, the firmware can activate the pump shutdown safety latch.

---

# Blynk Integration

The ESP32 publishes telemetry to Blynk.

### Datastreams

| Virtual Pin | Data                |
| ----------- | ------------------- |
| V0          | Flow 1              |
| V1          | Flow 2              |
| V2          | Water Level         |
| V3          | Flow Difference     |
| V4          | Blockage Status     |
| V5          | Pump Status         |
| V6          | Full Level Count    |
| V7          | Water Status        |
| V8          | Blue LED            |
| V9          | Green LED           |
| V10         | Yellow LED          |
| V11         | Red LED             |
| V12         | Manual Pump Control |

Blynk can also be used for remote pump control through the relay.

---

# Software Architecture

```text
HIDPA/
│
├── backend/
│   ├── app/
│   │   ├── blynk.py
│   │   ├── main.py
│   │   ├── train.py
│   │   └── __init__.py
│   │
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_api.py
│   │
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   └── utils/
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
│
├── .env.example
├── .gitignore
└── README.md
```

---

# Backend

The backend is built using:

* Python
* FastAPI
* Pydantic
* SQLite
* Pandas
* NumPy
* Scikit-learn
* Joblib
* Pytest

### Backend Responsibilities

The FastAPI backend handles:

* IoT telemetry ingestion
* Blynk communication
* Sensor data storage
* Latest sensor readings
* Historical sensor data
* Drainage diagnosis
* Sensor-health analysis
* AI prediction
* Model training
* Alerts
* Analytics
* Dataset quality checks
* Experiments
* Simulation
* CSV export

---

# Frontend

The dashboard is built using:

* React
* Vite
* JavaScript
* CSS

The dashboard provides multiple views:

```text
Overview
Diagnostics
Analytics
Drain Health
Alerts
Sensor Data
Experiments
Digital Twin
Simulation
System Status
About
```

The frontend supports both:

### Live Mode

Telemetry is retrieved from the FastAPI backend.

```text
React
  ↓
FastAPI
  ↓
Blynk
  ↓
ESP32
```

### Demo Mode

The dashboard can operate using local simulated scenarios when live telemetry is unavailable.

This allows the interface and diagnosis workflow to be demonstrated without requiring the physical hardware.

---

# API

Important backend endpoints include:

```text
GET  /api/health
GET  /api/status

GET  /api/sensors/latest
GET  /api/sensors/history
GET  /api/sensors/health

POST /api/ingest
POST /api/ingest/blynk

GET  /api/ai/prediction
POST /api/ai/predict
GET  /api/ai/model-info
POST /api/ai/train

GET  /api/drain-health
GET  /api/maintenance/priority

GET  /api/alerts
GET  /api/analytics

GET  /api/experiments
POST /api/experiments/{id}/stop
GET  /api/experiments/{id}/samples

GET  /api/dataset/quality
POST /api/simulation

GET  /api/export.csv
```

---

# Local Development

## Prerequisites

Install:

* Python 3.10+
* Node.js
* npm
* Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/Kash1444/HIDPA.git
cd HIDPA
```

---

# Backend Setup

### BACKEND TERMINAL

Create and activate a virtual environment:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

---

## Environment Variables

Create the local environment file:

```text
.env
```

Use `.env.example` as the template.

Example:

```env
DRAINGUARD_MODE=auto
DRAINGUARD_DB=backend/drainguard.db
DRAINGUARD_STALE_SECONDS=120
DRAINGUARD_POLL_SECONDS=5
DRAINGUARD_MODEL_PATH=backend/models/model.joblib

BLYNK_TOKEN=
BLYNK_BASE_URL=https://blynk.cloud
```

**Never commit `.env` or expose the Blynk token.**

---

## Start the Backend

### BACKEND TERMINAL

From the repository root:

```powershell
uvicorn app.main:app --app-dir backend --reload
```

The backend will normally be available at:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

---

# Frontend Setup

### FRONTEND TERMINAL

Open another terminal:

```powershell
cd C:\Users\Kash\HIDPA\frontend
npm install
```

Start the development server:

```powershell
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

During local development, `/api` requests are proxied to the FastAPI backend.

---

# Testing

Backend tests use Pytest.

### BACKEND TERMINAL

```powershell
cd C:\Users\Kash\HIDPA\backend
.\.venv\Scripts\Activate.ps1
pytest -q
```

The current test suite contains API and backend behavior tests.

---

# Production Build

### FRONTEND TERMINAL

```powershell
cd C:\Users\Kash\HIDPA\frontend
npm run build
```

The production files are generated in:

```text
frontend/dist/
```

---

# GitHub Pages Deployment

The frontend is configured for GitHub Pages deployment through GitHub Actions.

Workflow:

```text
.github/workflows/deploy-pages.yml
```

The workflow:

1. Checks out the repository
2. Installs Node.js
3. Installs frontend dependencies
4. Builds the React application
5. Uploads the Pages artifact
6. Deploys the frontend to GitHub Pages

The Vite base path is configured for:

```text
/HIDPA/
```

The expected public frontend URL is:

```text
https://kash1444.github.io/HIDPA/
```

> GitHub Pages hosts the frontend only. A public deployment of the FastAPI backend is required for live telemetry outside the local development environment.

---

# Production Architecture

For a public deployment, the recommended architecture is:

```text
                    Internet
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
      GitHub Pages          FastAPI Server
       React Frontend       Public HTTPS API
             │                   │
             │                   ▼
             │              Blynk Cloud
             │                   │
             │                   ▼
             │                 ESP32
             │
             └────── HTTPS ─────┘
```

The Blynk authentication token must remain on the backend.

It should **never** be placed in:

* React source code
* Vite environment variables exposed to the browser
* GitHub Pages build files
* Public GitHub repositories

---

# AI and Trustworthiness

HIDPA is designed so that the AI layer does not replace the embedded safety mechanisms.

The ESP32 continues to handle deterministic hardware-level actions such as:

* Blockage threshold detection
* Water-level warnings
* Pump control
* Critical water-level shutdown

The backend provides higher-level intelligence such as:

* Risk estimation
* Sensor reliability
* Diagnosis
* Confidence
* Severity
* Recommended action
* Historical analysis
* Machine-learning prediction

This separation helps ensure that a machine-learning model failure does not remove the fundamental embedded safety behavior.

---

# Machine Learning

The project is designed to support a Random Forest model for drainage condition prediction.

Potential model inputs include:

```text
Flow 1
Flow 2
Flow Difference
Flow Ratio
Water Level
Rolling Flow Statistics
Flow Change
Water-Level Change
Sensor Health
```

The system prioritizes real collected telemetry and validated labels rather than fabricated performance metrics.

Until a validated model is available, the backend uses:

```text
RULE_BASED_FALLBACK
```

This status is exposed to the dashboard so users can distinguish between machine-learning predictions and deterministic fallback logic.

---

# Safety and Reliability

The system uses multiple layers of protection.

### Embedded Safety

The ESP32 maintains direct control over:

* Relay
* Pump
* Buzzer
* LEDs
* Critical water-level handling

### Backend Reliability

The backend evaluates:

* Data freshness
* Sensor health
* Missing data
* Conflicting readings
* Model availability
* Prediction confidence

### Dashboard Transparency

The dashboard exposes the provenance of the diagnosis rather than presenting every result as an AI prediction.

Possible model states include:

```text
MODEL
RULE_BASED_FALLBACK
UNCERTAIN
OFFLINE
```

---

# Project Status

Current implementation includes:

* [x] ESP32 drainage monitoring
* [x] Dual flow monitoring
* [x] Ultrasonic water-level monitoring
* [x] Pump relay control
* [x] LED and buzzer warning system
* [x] Blynk telemetry
* [x] FastAPI backend
* [x] SQLite data storage
* [x] Rule-based diagnosis
* [x] Sensor-health analysis
* [x] React dashboard
* [x] Demo/simulation mode
* [x] Backend test suite
* [x] Production frontend build
* [x] GitHub Pages workflow
* [ ] Public backend deployment
* [ ] Validated machine-learning model using sufficient real-world labelled data
* [ ] Final PCB implementation

---

# Future Improvements

Planned development includes:

* Public HTTPS backend deployment
* Larger real-world telemetry dataset
* Temporal model validation
* Random Forest model validation
* Improved anomaly detection
* Rainfall integration
* Predictive maintenance
* More robust sensor fault detection
* Hardware PCB integration
* Extended digital twin capabilities
* Long-term drainage health analytics

---

# Project Demonstration

The physical prototype simulates an urban drainage environment using a water reservoir, pump, pipe system, flow sensors, and a controllable blockage mechanism.

The system demonstrates the complete pipeline:

```text
Physical Drain
      ↓
Sensors
      ↓
ESP32
      ↓
Blynk
      ↓
FastAPI
      ↓
Diagnosis / AI
      ↓
React Dashboard
      ↓
Human-readable Alert & Action
```

---

# Technology Stack

| Layer            | Technologies                 |
| ---------------- | ---------------------------- |
| Microcontroller  | ESP32                        |
| IoT              | Blynk                        |
| Backend          | Python, FastAPI              |
| Database         | SQLite                       |
| Machine Learning | Scikit-learn                 |
| Data Processing  | NumPy, Pandas                |
| Model Storage    | Joblib                       |
| Frontend         | React, Vite                  |
| Testing          | Pytest                       |
| Deployment       | GitHub Actions, GitHub Pages |
| Version Control  | Git, GitHub                  |

---

# Repository

GitHub:

**https://github.com/Kash1444/HIDPA**

---

# License

This project is licensed under the MIT License.

See [`LICENSE`](LICENSE) for details.

---

## Author

**Dharmaprakash**

B.E. Computer Science and Engineering
KCG College of Technology, Chennai

Focused on:

* Artificial Intelligence
* Machine Learning
* Backend Development
* IoT Systems
* Generative AI
* Data-driven applications
