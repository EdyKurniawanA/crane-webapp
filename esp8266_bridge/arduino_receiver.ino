#include <Servo.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "HX711.h"

// Konfigurasi Servo
Servo myServo;
int potPin = A0;
int potValue = 0;
int servoAngle = 90;

// Konfigurasi DHT22
#define dht_pin 35
#define dht_type DHT22
DHT dht22(dht_pin, dht_type);

// Konfigurasi HCSR04
#define triq1 8
#define echo1 34
#define triq3 2
#define echo3 30
#define triq2 3
#define echo2 32

// Konfigurasi Sensor Getaran
#define VIBRATION_PIN 44
unsigned long lastVibrationTime = 0;
unsigned long vibrationInterval = 0;
unsigned long noVibrationTime = 0;
int vibrationCount = 0;
float vibrationFrequency = 0;

// Konfigurasi HX711
#define DT 46
#define SCK 48
HX711 scale;
float calibration_factor = -81.0;

// Konfigurasi LCD
LiquidCrystal_I2C lcd(0x27, 20, 4);

// Konfigurasi Motor Driver
const int button1 = 39; //motor 1 kri
const int button2 = 47; //motor 1 kanan
const int button3 = 41; //motor 2 naik
const int button4 = 49; //motor 2 turun
const int buttonForward = 37; //maju
const int buttonBackward = 43; //mundur

const int motor1_in1 = 23; 
const int motor1_in2 = 25;
const int motor1_ena = 11;
//motor atas bawah (Y)
const int motor2_in3 = 27;
const int motor2_in4 = 29;
const int motor2_enb = 10;
//motor maju mundur(z)
const int motor_z_in1 = 22; 
const int motor_z_in2 = 24;
const int motor_z_ena = 12;

// Variables for remote control
String inputString = "";
boolean stringComplete = false;
int remoteX = 0, remoteY = 0, remoteZ = 0;
int remoteSpeedX = 100, remoteSpeedY = 80, remoteSpeedZ = 200;
bool isRemoteControl = false;

// Variables for manual control
int x = 0, y = 0, z = 0;

// Timer untuk interval pembacaan sensor
unsigned long lastSensorReadTime = 0;
const unsigned long sensorInterval = 500; // Interval pembacaan sensor dalam ms

// Data sensor
float humi, temp, weight;
long jarakX, jarakY, jarakZ;

void setup() {
  Serial1.begin(115200); // Serial untuk komunikasi ke ESP8266
  Serial.begin(9600);  // Serial untuk debugging

  dht22.begin();

  pinMode(triq1, OUTPUT);
  pinMode(echo1, INPUT);
  pinMode(triq2, OUTPUT);
  pinMode(echo2, INPUT);
  pinMode(triq3, OUTPUT);
  pinMode(echo3, INPUT);
  pinMode(VIBRATION_PIN, INPUT);

  pinMode(button1, INPUT_PULLUP);
  pinMode(button2, INPUT_PULLUP);
  pinMode(button3, INPUT_PULLUP);
  pinMode(button4, INPUT_PULLUP);
  pinMode(buttonForward, INPUT_PULLUP);
  pinMode(buttonBackward, INPUT_PULLUP);

  pinMode(motor1_in1, OUTPUT);
  pinMode(motor1_in2, OUTPUT);
  pinMode(motor1_ena, OUTPUT);

  pinMode(motor2_in3, OUTPUT);
  pinMode(motor2_in4, OUTPUT);
  pinMode(motor2_enb, OUTPUT);

  pinMode(motor_z_in1, OUTPUT);
  pinMode(motor_z_in2, OUTPUT);
  pinMode(motor_z_ena, OUTPUT);

  myServo.attach(5);

  lcd.init();
  lcd.backlight();

  scale.begin(DT, SCK);
  scale.set_scale(calibration_factor);
  scale.tare();

  inputString.reserve(200);
}

void loop() {
  unsigned long currentMillis = millis();

  // Process any incoming commands from ESP8266
  if (stringComplete) {
    processCommand(inputString);
    inputString = "";
    stringComplete = false;
    isRemoteControl = true;
    // Send acknowledgment
    Serial1.println("OK");
  }

  // Check for manual control if not in remote control mode
  if (!isRemoteControl) {
    bool button1State = !digitalRead(button1);
    bool button2State = !digitalRead(button2);
    bool button3State = !digitalRead(button3);
    bool button4State = !digitalRead(button4);
    bool buttonForwardState = !digitalRead(buttonForward);
    bool buttonBackwardState = !digitalRead(buttonBackward);

    x = button1State ? -1 : button2State ? 1 : 0;
    y = button3State ? 1 : button4State ? -1 : 0;
    z = buttonForwardState ? 1 : buttonBackwardState ? -1 : 0;

    // If any button is pressed, exit remote control mode
    if (x != 0 || y != 0 || z != 0) {
      isRemoteControl = false;
    }
  }

  // Control motors based on active control mode
  if (isRemoteControl) {
    controlMotor1(remoteX, remoteSpeedX);
    controlMotor2(remoteY, remoteSpeedY);
    controlMotorZ(remoteZ, remoteSpeedZ);
  } else {
    controlMotor1(x, 100);
    controlMotor2(y, y == 1 ? 80 : 50);
    controlMotorZ(z, 200);
  }

  // Membaca sensor setiap interval
  if (currentMillis - lastSensorReadTime >= sensorInterval) {
    lastSensorReadTime = currentMillis;

    humi = dht22.readHumidity();
    temp = dht22.readTemperature();
    jarakX = readUltrasonic(triq1, echo1);
    jarakY = readUltrasonic(triq3, echo3);
    jarakZ = readUltrasonic(triq2, echo2);
    weight = scale.get_units();
    weight = (abs(weight) < 1.0) ? 0 : weight;

    updateVibration();

    // Menampilkan data di LCD
    lcd.setCursor(0, 0);
    lcd.print("H:" + String(humi, 1) + "% T:" + String(temp, 1) + "C");
    lcd.setCursor(0, 1);
    lcd.print("Berat: " + String(weight, 1) + " g");
    lcd.setCursor(0, 2);
    lcd.print("X:" + String(jarakX) + " Y:" + String(jarakY) + " Z:" + String(jarakZ));
    lcd.setCursor(0, 3);
    lcd.print("Vib:" + String(vibrationFrequency, 1) + "Hz C:" + String(vibrationCount));
    
    // Send sensor data to ESP8266
    sendDataToESP8266();
  }

  // Mengatur servo
  potValue = analogRead(potPin);
  int mappedValue = map(potValue, 0, 1023, -90, 90);
  if (mappedValue > -10 && mappedValue < 10) {
    myServo.write(servoAngle);
  } else {
    servoAngle = constrain(servoAngle + mappedValue / 50, 0, 180);
    myServo.write(servoAngle);
  }
}

void serialEvent1() {
  while (Serial1.available()) {
    char inChar = (char)Serial1.read();
    inputString += inChar;
    if (inChar == '\n') {
      stringComplete = true;
    }
  }
}

void processCommand(String command) {
  // Parse command string: X,state,speed|Y,state,speed|Z,state,speed|S,angle
  int index = 0;
  while (index < command.length()) {
    char motorType = command.charAt(index);
    index += 2; // Skip motor type and comma
    
    int state = command.substring(index, command.indexOf(',', index)).toInt();
    index = command.indexOf(',', index) + 1;
    
    int speed = command.substring(index, command.indexOf('|', index)).toInt();
    index = command.indexOf('|', index) + 1;
    
    switch (motorType) {
      case 'X':
        remoteX = state;
        remoteSpeedX = speed;
        break;
      case 'Y':
        remoteY = state;
        remoteSpeedY = speed;
        break;
      case 'Z':
        remoteZ = state;
        remoteSpeedZ = speed;
        break;
      case 'S':
        servoAngle = speed; // In this case, 'speed' is actually the angle
        break;
    }
  }
}

void sendDataToESP8266() {
  String jsonData = "{";
  jsonData += "\"humidity\":" + String(humi, 1) + ",";
  jsonData += "\"temperature\":" + String(temp, 1) + ",";
  jsonData += "\"distanceX\":" + String(jarakX) + ",";
  jsonData += "\"distanceY\":" + String(jarakY) + ",";
  jsonData += "\"distanceZ\":" + String(jarakZ) + ",";
  jsonData += "\"weight\":" + String(weight, 1) + ",";
  jsonData += "\"vibrationFrequency\":" + String(vibrationFrequency, 1) + ",";
  jsonData += "\"vibrationCount\":" + String(vibrationCount);
  jsonData += "}";

  Serial1.println(jsonData);
}

long readUltrasonic(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH);
  return (duration > 0) ? (duration / 2) / 29.1 : -1;
}

void updateVibration() {
  int vibrationValue = digitalRead(VIBRATION_PIN);
  unsigned long currentTime = micros();

  if (vibrationValue == HIGH) {
    if (currentTime - lastVibrationTime > 100) {
      vibrationCount++;
      vibrationInterval = currentTime - lastVibrationTime;
      lastVibrationTime = currentTime;
    }
    noVibrationTime = millis();
  } else {
    if (millis() - noVibrationTime > 1000) {
      vibrationInterval = 0;
      vibrationFrequency = 0;
      vibrationCount = 0;
    }
  }

  if (vibrationInterval > 0) {
    vibrationFrequency = 1000.0 / vibrationInterval;
  }
}

void controlMotor1(int state, int speed) {
  if (state == -1) {
    digitalWrite(motor1_in1, HIGH);
    digitalWrite(motor1_in2, LOW);
    analogWrite(motor1_ena, speed);
  } else if (state == 1) {
    digitalWrite(motor1_in1, LOW);
    digitalWrite(motor1_in2, HIGH);
    analogWrite(motor1_ena, speed);
  } else {
    digitalWrite(motor1_in1, LOW);
    digitalWrite(motor1_in2, LOW);
  }
}

void controlMotor2(int state, int speed) {
  if (state == 1) {
    digitalWrite(motor2_in3, HIGH);
    digitalWrite(motor2_in4, LOW);
    analogWrite(motor2_enb, speed);
  } else if (state == -1) {
    digitalWrite(motor2_in3, LOW);
    digitalWrite(motor2_in4, HIGH);
    analogWrite(motor2_enb, speed);
  } else {
    digitalWrite(motor2_in3, LOW);
    digitalWrite(motor2_in4, LOW);
  }
}

void controlMotorZ(int state, int speed) {
  if (state == 1) {
    digitalWrite(motor_z_in1, HIGH);
    digitalWrite(motor_z_in2, LOW);
    analogWrite(motor_z_ena, speed);
  } else if (state == -1) {
    digitalWrite(motor_z_in1, LOW);
    digitalWrite(motor_z_in2, HIGH);
    analogWrite(motor_z_ena, speed);
  } else {
    digitalWrite(motor_z_in1, LOW);
    digitalWrite(motor_z_in2, LOW);
  }
} 