#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>

// Add these at the top after includes
#define LOG_TO_SERIAL    // Comment this out to disable serial logging
#define LOG_TO_FIREBASE  // Comment this out to disable Firebase logging

// WiFi Configuration
#define WIFI_SSID "ROG"
#define WIFI_PASSWORD "carisendiri"

// Firebase Configuration
#define FIREBASE_HOST "https://automaticcrane-62ca3-default-rtdb.asia-southeast1.firebasedatabase.app/"
#define FIREBASE_AUTH "AIzaSyCEbGm8crlQCUKmaLKjJlFcrrrab6SLptQ"

// Constants
#define WIFI_RETRY_DELAY 5000
#define FIREBASE_RETRY_DELAY 1000
#define COMMAND_INTERVAL 100    // Motor control interval
#define SENSOR_INTERVAL 10000   // Sensor update interval
#define MAX_RETRIES 5
#define WATCHDOG_TIMEOUT 15000

// Firebase objects
FirebaseConfig config;
FirebaseAuth auth;
FirebaseData fbdo;
FirebaseData fbdo_control; // Separate object for control operations

// Control states
struct MotorState {
  int state;  // -1, 0, 1
  int speed;  // 0-255
};

struct ServoState {
  int angle;  // 0-180
};

MotorState motorX = {0, 100};
MotorState motorY = {0, 80};
MotorState motorZ = {0, 200};
ServoState servo = {90};

// Timing variables
unsigned long lastSensorUpdate = 0;
unsigned long lastCommandSent = 0;
unsigned long lastWiFiCheck = 0;
unsigned long lastFirebaseCheck = 0;
unsigned long lastArduinoResponse = 0;

// State tracking
bool isFirebaseConnected = false;
bool isArduinoResponding = true;
int wifiRetryCount = 0;
int firebaseRetryCount = 0;

// Function to log messages with timestamp and category
void logMessage(const String &category, const String &message, bool toFirebase = true) {
  String timestamp = String(millis());
  String logEntry = "[" + timestamp + "][" + category + "] " + message;
  
  #ifdef LOG_TO_SERIAL
    Serial.println(logEntry);
  #endif
  
  #ifdef LOG_TO_FIREBASE
    if (toFirebase && isFirebaseConnected) {
      FirebaseJson json;
      json.set("timestamp", timestamp);
      json.set("category", category);
      json.set("message", message);
      
      String logPath = "/logs/" + timestamp;
      if (Firebase.RTDB.setJSON(&fbdo, logPath.c_str(), &json)) {
        #ifdef LOG_TO_SERIAL
          Serial.println("Log entry saved to Firebase");
        #endif
      }
    }
  #endif
}

// Add these status tracking variables
struct SystemStatus {
  int wifiSignalStrength;
  float wifiResponseTime;
  int firebaseLatency;
  unsigned long lastSensorUpdateTime;
  unsigned long lastControlUpdateTime;
  int successfulCommands;
  int failedCommands;
  int sensorUpdateCount;
  int errorCount;
} status;

// Modify setupWiFi to include more logging
void setupWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    logMessage("WIFI", "Already connected to WiFi");
    return;
  }
  
  logMessage("WIFI", "Connecting to WiFi SSID: " + String(WIFI_SSID));
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  unsigned long startTime = millis();
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    unsigned long connectionTime = millis() - startTime;
    status.wifiResponseTime = connectionTime;
    status.wifiSignalStrength = WiFi.RSSI();
    
    String connInfo = "Connected to WiFi in " + String(connectionTime) + "ms";
    connInfo += "\nIP: " + WiFi.localIP().toString();
    connInfo += "\nSignal Strength: " + String(WiFi.RSSI()) + " dBm";
    logMessage("WIFI", connInfo);
    
    wifiRetryCount = 0;
  } else {
    logMessage("ERROR", "WiFi connection failed after " + String(attempts) + " attempts", true);
    wifiRetryCount++;
    status.errorCount++;
  }
}

void setupFirebase() {
  if (isFirebaseConnected) return;

  // Firebase authentication
  auth.user.email = "afwanjml@gmail.com";
  auth.user.password = "22februari2004";
  
  config.host = FIREBASE_HOST;
  config.api_key = FIREBASE_AUTH;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  // Set timeouts
  Firebase.setReadTimeout(fbdo, 1000 * 60);
  Firebase.setwriteSizeLimit(fbdo, "tiny");
  Firebase.setReadTimeout(fbdo_control, 1000 * 60);
  Firebase.setwriteSizeLimit(fbdo_control, "tiny");
  
  if (Firebase.ready()) {
    isFirebaseConnected = true;
    firebaseRetryCount = 0;
    Serial.println("Firebase initialized");
  } else {
    Serial.println("Firebase initialization failed");
    firebaseRetryCount++;
  }
}

void emergencyStop() {
  motorX = {0, 100};
  motorY = {0, 80};
  motorZ = {0, 200};
  servo = {90};
  
  Serial.println("X,0,0|Y,0,0|Z,0,0|S,90");
  
  if (isFirebaseConnected) {
    FirebaseJson json;
    json.set("state", 0);
    Firebase.RTDB.setJSON(&fbdo_control, "/controls/motorX", &json);
    Firebase.RTDB.setJSON(&fbdo_control, "/controls/motorY", &json);
    Firebase.RTDB.setJSON(&fbdo_control, "/controls/motorZ", &json);
    
    FirebaseJson servoJson;
    servoJson.set("angle", 90);
    Firebase.RTDB.setJSON(&fbdo_control, "/controls/servo", &servoJson);
  }
}

void checkConnections() {
  unsigned long currentMillis = millis();
  
  // Check WiFi
  if (currentMillis - lastWiFiCheck >= WIFI_RETRY_DELAY) {
    lastWiFiCheck = currentMillis;
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi disconnected. Reconnecting...");
      setupWiFi();
      if (wifiRetryCount >= MAX_RETRIES) {
        emergencyStop();
        ESP.restart();
      }
    }
  }
  
  // Check Firebase
  if (currentMillis - lastFirebaseCheck >= FIREBASE_RETRY_DELAY) {
    lastFirebaseCheck = currentMillis;
    if (!isFirebaseConnected || !Firebase.ready()) {
      Serial.println("Firebase disconnected. Reconnecting...");
      setupFirebase();
      if (firebaseRetryCount >= MAX_RETRIES) {
        emergencyStop();
        ESP.restart();
      }
    }
  }
  
  // Check Arduino
  if (currentMillis - lastArduinoResponse >= WATCHDOG_TIMEOUT) {
    Serial.println("Arduino not responding!");
    isArduinoResponding = false;
    emergencyStop();
  }
}

// Modify processControlCommands to include command tracking
void processControlCommands() {
  if (!isFirebaseConnected) {
    logMessage("CONTROL", "Skipping control processing - Firebase not connected");
    return;
  }
  
  unsigned long startTime = millis();
  bool success = true;
  
  // Read motor X state
  if (Firebase.RTDB.getJSON(&fbdo_control, "/controls/motorX")) {
    FirebaseJson *json = fbdo_control.jsonObjectPtr();
    FirebaseJsonData state;
    FirebaseJsonData speed;
    json->get(state, "state");
    json->get(speed, "speed");
    if (state.success && speed.success) {
      int newState = state.intValue;
      int newSpeed = speed.intValue;
      
      if (newState != motorX.state || newSpeed != motorX.speed) {
        logMessage("MOTOR_X", "State change: " + String(motorX.state) + "->" + String(newState) + 
                            ", Speed: " + String(motorX.speed) + "->" + String(newSpeed));
      }
      
      motorX.state = newState;
      motorX.speed = speed.intValue;
    }
  } else {
    success = false;
    logMessage("ERROR", "Failed to read motorX: " + fbdo_control.errorReason());
  }
  
  // Similar blocks for motorY, motorZ, and servo with logging
  // [Code omitted for brevity but follows same pattern]
  
  status.firebaseLatency = millis() - startTime;
  
  if (success) {
    status.successfulCommands++;
    logMessage("CONTROL", "Commands processed in " + String(status.firebaseLatency) + "ms");
  } else {
    status.failedCommands++;
    firebaseRetryCount++;
    if (firebaseRetryCount >= MAX_RETRIES) {
      isFirebaseConnected = false;
      logMessage("ERROR", "Firebase connection lost after " + String(MAX_RETRIES) + " retries");
    }
  }
}

// Modify processSensorData to include sensor tracking
void processSensorData() {
  if (Serial.available() > 0) {
    String data = Serial.readStringUntil('\n');
    
    if (data.length() > 0 && millis() - lastSensorUpdate >= SENSOR_INTERVAL) {
      unsigned long startTime = millis();
      logMessage("SENSOR", "Processing new sensor data");
      
      // Send sensor data to Firebase
      bool allSuccess = true;
      allSuccess &= sendToFirebase("/sensor/temp", getValue(data, "temperature"));
      allSuccess &= sendToFirebase("/sensor/humi", getValue(data, "humidity"));
      allSuccess &= sendToFirebase("/sensor/jarakX", getValue(data, "distanceX"));
      allSuccess &= sendToFirebase("/sensor/jarakY", getValue(data, "distanceY"));
      allSuccess &= sendToFirebase("/sensor/jarakZ", getValue(data, "distanceZ"));
      allSuccess &= sendToFirebase("/sensor/weight", getValue(data, "weight"));
      allSuccess &= sendToFirebase("/sensor/vibrationFrequency", getValue(data, "vibrationFrequency"));
      allSuccess &= sendToFirebase("/sensor/vibrationCount", getValue(data, "vibrationCount"));
      
      unsigned long processingTime = millis() - startTime;
      status.lastSensorUpdateTime = millis();
      status.sensorUpdateCount++;
      
      logMessage("SENSOR", "Sensor update " + 
                (allSuccess ? "successful" : "partially failed") + 
                " in " + String(processingTime) + "ms");
      
      lastSensorUpdate = millis();
    }
  }
}

void sendToFirebase(const String &path, const String &value) {
  if (!isFirebaseConnected || value.length() == 0) return;
  
  if (Firebase.RTDB.setFloat(&fbdo, path.c_str(), value.toFloat())) {
    Serial.println(path + " updated successfully");
  } else {
    Serial.println("Failed to update " + path + ": " + fbdo.errorReason());
    firebaseRetryCount++;
  }
}

String getValue(const String &data, const String &key) {
  String searchKey = "\"" + key + "\":";
  int start = data.indexOf(searchKey);
  if (start == -1) return "";
  
  start += key.length() + 3;
  int end = data.indexOf(',', start);
  if (end == -1) end = data.indexOf('}', start);
  
  return data.substring(start, end);
}

void sendCommandToArduino() {
  String command = "X," + String(motorX.state) + "," + String(motorX.speed) + "|";
  command += "Y," + String(motorY.state) + "," + String(motorY.speed) + "|";
  command += "Z," + String(motorZ.state) + "," + String(motorZ.speed) + "|";
  command += "S," + String(servo.angle);
  
  Serial.println(command);
}

// Add periodic status reporting
void reportSystemStatus() {
  static unsigned long lastStatusReport = 0;
  const unsigned long STATUS_INTERVAL = 60000; // Report every minute
  
  if (millis() - lastStatusReport >= STATUS_INTERVAL) {
    FirebaseJson statusJson;
    statusJson.set("wifi/signal", status.wifiSignalStrength);
    statusJson.set("wifi/responseTime", status.wifiResponseTime);
    statusJson.set("firebase/latency", status.firebaseLatency);
    statusJson.set("updates/lastSensor", status.lastSensorUpdateTime);
    statusJson.set("updates/lastControl", status.lastControlUpdateTime);
    statusJson.set("stats/successCommands", status.successfulCommands);
    statusJson.set("stats/failedCommands", status.failedCommands);
    statusJson.set("stats/sensorUpdates", status.sensorUpdateCount);
    statusJson.set("stats/errors", status.errorCount);
    
    if (Firebase.RTDB.setJSON(&fbdo, "/system_status", &statusJson)) {
      logMessage("STATUS", "System status updated");
    }
    
    lastStatusReport = millis();
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.setSleepMode(WIFI_LIGHT_SLEEP);
  setupWiFi();
  setupFirebase();
}

void loop() {
  unsigned long currentMillis = millis();
  
  checkConnections();
  
  if (currentMillis - lastCommandSent >= COMMAND_INTERVAL) {
    lastCommandSent = currentMillis;
    
    if (isFirebaseConnected && WiFi.status() == WL_CONNECTED) {
      processControlCommands();
      status.lastControlUpdateTime = currentMillis;
      if (isArduinoResponding) {
        sendCommandToArduino();
      }
    }
  }
  
  processSensorData();
  reportSystemStatus();
  
  if (Serial.available()) {
    String response = Serial.readStringUntil('\n');
    if (response == "OK") {
      lastArduinoResponse = currentMillis;
      isArduinoResponding = true;
      logMessage("ARDUINO", "Received OK response");
    } else {
      logMessage("ARDUINO", "Received: " + response);
    }
  }
} 