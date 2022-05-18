#include <LiquidCrystal.h>

#define S0 28
#define S1 30
#define S2 32
#define S3 34
#define COL_OUT 36
#define LED_SENSOR 22
#define MH_OUT A8

unsigned long hl, ll, lh, hh; // first letter is for S2, second is for S3; h is HIGH, l is LOW
LiquidCrystal lcd(8, 9, 4, 5, 6, 7);
String colors[] = {"white", "blue", "black", "red", "green"};
byte chosenColour = 0;
byte count = 0;
byte measureTaken = 0;
unsigned long times;
bool bpValidate = false;
bool measuring = false;
bool bp_reset = false;

// Three functions for interruptions
void changeColor()
{
    chosenColour++;
    if (chosenColour == 5)
        chosenColour = 0;
}

void validateColor()
{
    bpValidate = true;
}

void reset()
{
    bp_reset = true;
}

// latest calibration : 2022/05/18 13:24
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

void setup()
{
    pinMode(LED_SENSOR, OUTPUT);
    pinMode(S0, OUTPUT);
    pinMode(S1, OUTPUT);
    pinMode(S2, OUTPUT);
    pinMode(S3, OUTPUT);
    pinMode(COL_OUT, INPUT);
    pinMode(18, INPUT_PULLUP);
    pinMode(19, INPUT_PULLUP);
    pinMode(2, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(18), changeColor, FALLING);
    attachInterrupt(digitalPinToInterrupt(19), validateColor, FALLING);
    attachInterrupt(digitalPinToInterrupt(2), reset, FALLING);
    lcd.begin(2, 2);
    Serial.begin(9600);
    digitalWrite(S0, HIGH);
    digitalWrite(S1, HIGH);
    digitalWrite(LED_SENSOR, LOW);
}

void loop()
{
    lcd.setCursor(0, 0);
    lcd.print("Choose a color :");

    do
    {
        lcd.setCursor(0, 1);
        lcd.print(colors[chosenColour] + "  ");
    } while (!bpValidate);
    bpValidate = false;

    Serial.print("$ ");
    Serial.println(chosenColour); // Sending chosen color

    lcd.setCursor(0, 0);
    lcd.print("color :         ");
    lcd.setCursor(10, 0);
    lcd.print("Count:");
    lcd.setCursor(12, 1);
    lcd.print(count);

    times = millis();

    bp_reset = false;
    do
    {
        if (measuring == false && analogRead(MH_OUT) < 350)
        {
            measuring = true;
            // Start of average calculator -------------------
            hl = 0;
            ll = 0;
            lh = 0;
            hh = 0;
            delay(50);
            for (int j = 0; j < 10; j++)
            {
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
            hl /= 10;
            ll /= 10;
            lh /= 10;
            hh /= 10;
            // End of average calculator -------------------

            measureTaken = colorValidator(hl, ll, lh, hh);

            Serial.println(measureTaken); // Sending measure

            if (chosenColour == measureTaken)
                count += 1;

            digitalWrite(LED_SENSOR, LOW);

            times = millis();
        }

        if (analogRead(MH_OUT) > 350)
        {
            measuring = false;
        }
        lcd.setCursor(12, 1);
        lcd.print(count);

    } while (bp_reset == false && times + 300000 > millis());
    // Exiting the loop after 5 min of inactivity

    Serial.println("% 99"); // Sending "END" signal
    chosenColour = 0;
    count = 0;

    lcd.clear();
}
