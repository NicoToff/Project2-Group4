#include <LiquidCrystal.h>

#define S0 28
#define S1 30
#define S2 32
#define S3 34
#define COL_OUT 36
#define LED_SENSOR 22
#define NBR_CHECKS 20

LiquidCrystal lcd( 8,  9,  4,  5,  6,  7);
String colors[] = {"red","blue","green","black","white"};
byte i = 0;
byte count = 0;
short total;
byte MH_OUT = A8;
byte red =0, green=0, blue=0,black=0,white=0;
bool bpValidate = 1;
int rouge, bleu;


void setup() {
  pinMode(LED_SENSOR,OUTPUT);
  pinMode(S0,OUTPUT);
  pinMode(S1,OUTPUT);
  pinMode(S2,OUTPUT);
  pinMode(S3,OUTPUT);
  pinMode(COL_OUT,INPUT);
  pinMode(18,INPUT_PULLUP);
  pinMode(19,INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(18), changeColor, FALLING);
  attachInterrupt(digitalPinToInterrupt(19), validateColor, FALLING);
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

  lcd.setCursor(0,0);
  lcd.print("color :         ");
  lcd.setCursor(10,0);
  lcd.print("Count:");
  lcd.setCursor(12,1);
  lcd.print(count);

  do{
    if(analogRead(MH_OUT) < 600){
      bleu = 0;rouge = 0;total=0;
      for(int i = 0; i<NBR_CHECKS; i++) {
        digitalWrite(LED_SENSOR,HIGH);
        digitalWrite(S2, HIGH); // lumière complète, sans filtre
        digitalWrite(S3, LOW);
        total += pulseIn(COL_OUT, LOW);
  
        digitalWrite(S2, LOW); // rouge
        digitalWrite(S3, LOW);
        rouge += pulseIn(COL_OUT, LOW);
  
        //Serial.print("rouge: ");
        //Serial.println(rouge);
  
        digitalWrite(S2, LOW); // rouge
        digitalWrite(S3, HIGH);
        bleu += pulseIn(COL_OUT, LOW);
      }
      
      total /= NBR_CHECKS;
      rouge /= NBR_CHECKS;
      bleu /= NBR_CHECKS;
      
      //Serial.print("bleu: ");
      //Serial.println(bleu);
    
      if(total <= 15 && bleu <  14){
        Serial.println("0");
        if(colors[i] == "white"){
          count += 1;
        }
      }
      
      else if(total >=23 && total <=30 && bleu > 65 && bleu < 75){
        Serial.println("2");
        if(colors[i] == "black"){
          count += 1;
        }
      }
      else if(total >=14 && total <=18 && bleu > 40 && bleu < 50){
        Serial.println("4");
        if(colors[i] == "green"){
          count += 1;
        }
      }
      else if(total >=10 && total <=16 && bleu > 25 && bleu < 35){
        Serial.println("1");
        if(colors[i] == "blue"){
          count += 1;
        }
      }
      else if(total >=5 && total <=12 && rouge < 35 && rouge > 20){
        Serial.println("3");
        if(colors[i] == "red"){
          count += 1;
        }
      }
      else{
        Serial.println("5");
      }
    
    //  Serial.print("  total: ");
    //  Serial.println(total);
    }
    digitalWrite(LED_SENSOR,LOW);
  
    lcd.setCursor(12,1);
    lcd.print(count);
  }while(1);
  count = 0;
  lcd.clear();
  
}

void changeColor() {
  i++;
  if(i==5)i = 0;
  
}

void validateColor (){
  bpValidate = 0;
}
