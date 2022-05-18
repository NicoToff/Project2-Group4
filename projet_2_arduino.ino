#include <LiquidCrystal.h>

#define S0 28
#define S1 30
#define S2 32
#define S3 34
#define COL_OUT 36
#define LED_SENSOR 22
#define MH_OUT A8
unsigned long hl, ll, lh ,hh;
LiquidCrystal lcd( 8,  9,  4,  5,  6,  7);
String colors[] = {"white","blue","black","red","green"};
byte i = 0;
byte count = 0;
byte val_count = 0;
unsigned long times;
bool bpValidate = 1;
bool state_= 1;
bool bp_reset = 0;

void changeColor() {
  i++;
  if(i==5)
    i = 0;
}

void validateColor (){
  bpValidate = 0;
}

void reset(){
  bp_reset = 1;
  
}

int colorValidator(unsigned long hl, unsigned long ll, unsigned long lh, unsigned long hh)
{
    if (hl <= 12 &&
        ll <= 34 &&
        lh <= 22 &&
        hh <= 27)
    {
        return 0; // White
    }
    else if (hl >= 15 && hl <= 34 &&
             ll >= 90 && ll <= 140 &&
             lh >= 30 && lh <= 63 &&
             hh >= 36 && hh <= 108)
    {
        return 1; // Blue
    }
    else if (hl >= 17 && hl <= 50 &&
             ll >= 75 && ll <= 120 &&
             lh >= 45 && lh <= 120 &&
             hh >= 80 && hh <= 150)
    {
        return 2; // Black
    }
    else if (hl >= 13 && hl <= 30 &&
             ll >= 32 && ll <= 55 &&
             lh >= 40 && lh <= 88 &&
             hh >= 55 && hh <= 102)
    {
        return 3; // Red
    }
    else if (hl >= 15 && hl <= 50 &&
             ll >= 60 && ll <= 130 &&
             lh >= 40 && lh <= 100 &&
             hh >= 30 && hh <= 100)
    {
        return 4; // Green
    }
    else
    {
        return 5; // Anomaly
    }
}

void setup() {
  pinMode(LED_SENSOR,OUTPUT);
  pinMode(S0,OUTPUT);
  pinMode(S1,OUTPUT);
  pinMode(S2,OUTPUT);
  pinMode(S3,OUTPUT);
  pinMode(COL_OUT,INPUT);
  pinMode(18,INPUT_PULLUP);
  pinMode(19,INPUT_PULLUP);
  pinMode(2,INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(18), changeColor, FALLING);
  attachInterrupt(digitalPinToInterrupt(19), validateColor, FALLING);
  attachInterrupt(digitalPinToInterrupt(2), reset, FALLING);
  lcd.begin(2, 2);
  Serial.begin(9600);
  digitalWrite(S0,HIGH);
  digitalWrite(S1,HIGH);
  digitalWrite(LED_SENSOR,LOW);
}

void loop() {
  lcd.setCursor(0,0);
  lcd.print("Choose a color :");

  do{
    lcd.setCursor(0,1);
    lcd.print(colors[i] + "  ");
  }while(bpValidate);
  bpValidate = 1;
  
  Serial.print("$ ");
  Serial.println(i);
  
  lcd.setCursor(0,0);
  lcd.print("color :         ");
  lcd.setCursor(10,0);
  lcd.print("Count:");
  lcd.setCursor(12,1);
  lcd.print(count);
  
  times = millis();

  bp_reset = 0;
  do{
    if(state_ == 1  && analogRead(MH_OUT) < 500){
      hl=0; ll=0; lh=0; hh=0;
      delay(50);
      for(int j = 0; j < 10; j++) {
        digitalWrite(LED_SENSOR, HIGH);
        digitalWrite(S2, HIGH);
        digitalWrite(S3, LOW);
        hl += pulseIn(COL_OUT, LOW);
    
        digitalWrite(S2, LOW);
        digitalWrite(S3, LOW);
        ll += pulseIn(COL_OUT, LOW);
    
        digitalWrite(S2, LOW);
        digitalWrite(S3, HIGH);
        lh += pulseIn(COL_OUT, LOW);
    
        digitalWrite(S2, HIGH);
        digitalWrite(S3, HIGH);
        hh += pulseIn(COL_OUT, LOW);
    
        digitalWrite(LED_SENSOR, LOW);
      }
      hl/=10; ll/=10; lh/=10; hh/=10;
      
      val_count = colorValidator(hl, ll, lh, hh);
      
      Serial.println(val_count); 

      if (i == val_count) count += 1;
      
      digitalWrite(LED_SENSOR,LOW);
      
      times = millis();
      state_ = 0;
    }
    
    if(analogRead(MH_OUT)> 350) state_ = 1;
    lcd.setCursor(12,1);
    lcd.print(count);

  }while(bp_reset == 0 && times + 300000 > millis());
  Serial.println("% 99");
  i=0;
  count = 0;
  lcd.clear(); 
}
