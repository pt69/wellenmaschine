//MIT-Lizenz: Copyright (c) 2018 Matthias Perenthaler
//
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


var millisek_seit_appstart;
var sek_seit_appstart;      
var min_seit_appstart;

var millisek_neustart = 0;
var sek_neustart = 0;  
var min_neustart = 0;  

var millisek_pause = 0;
var sek_pause = 0;
var min_pause = 0;

var millisek_timer = 0;
var sek_timer = 0;   
var min_timer = 0;    

var millisek_timer_aufnull = 0;
var sek_timer_aufnull = 0;
var min_timer_aufnull = 0;

var abstand_schwinger = 6; // Abstand der Schwinger
var sichtbarer_bereich = 0;     // Gesamtbreite der Welle
var amplitude = 0.0;       // Amplitude in Pixel
var wellenlaenge = 0.0;   // Wellenlänge in Pixel
var w_frequenz = 0;         // Frequenz in Anzahl pro Sekunde
var c_wellengeschw = 0;    //Ausbreitungsgeschwindigkeit der Welle
var delta_t = 0;            // Phasenverschiebung
var phasendifferenz_linksrechts = 0;

var y_werte_1;         // Array, um die y-Werte der 1. Welle zu speichern
var y_werte_2;         // Array, um die y-Werte der 2. Welle zu speichern
var y_werte_3;         // Array, um die y-Werte der resultierenden Welle zu speichern
var y_werte_laenge = 0;    // Anzahl der Schwinger

var schwingungsebene_y_wert = 0;

var bool_startstopp = 0;   // Animation starten, stoppen
var bool_pause = 0;   // Animation pausieren
var bool_startuhr_reset = 0;   // Animation starten, stoppen

var container_canvas;
var button1;
var button2;
var frequenz_slider;
var c_slider;
var amplitude_slider;
var phasendifferenz_slider;

function centerCanvas() {
  var x_canvas = (windowWidth-width)/2;
  var y_canvas = 25;  
  container_canvas.position(x_canvas,y_canvas);
  button1.position(x_canvas+150, y_canvas+80);
  button2.position(x_canvas+150, y_canvas+110); 
  frequenz_slider.position(x_canvas+585, y_canvas+70);
  c_slider.position(x_canvas+585, y_canvas+100);
  amplitude_slider.position(x_canvas+585, y_canvas+130);
  phasendifferenz_slider.position(x_canvas+585, y_canvas+160);
  
}

function windowResized() {
  centerCanvas();
}

function setup() {
  container_canvas = createCanvas(750, 600);
  var x_canvas = (windowWidth-width)/2;
  var y_canvas = 25;  
  container_canvas.position(x_canvas,y_canvas);

  sichtbarer_bereich = width-50;
  schwingungsebene_y_wert = height/2+50;

  app_startzeitpunkt = millis();
  
  // Start/Stop-Button anlegen
  button1 = createButton('Start/Stopp');
  button1.class("button1");
  button1.style("width:130px")
  button1.mousePressed(start_stopp);
  
  // Reset-Button anlegen
  button2 = createButton('Zurücksetzen');
  button2.class("button2");
  button2.style("width:130px")
  button2.mousePressed(stoppuhr_reset);
  
  y_werte_laenge = floor(sichtbarer_bereich/abstand_schwinger);
  y_werte_1 = new Array(y_werte_laenge);
  y_werte_2 = new Array(y_werte_laenge);
  y_werte_3 = new Array(y_werte_laenge);
  
   for (var i = 0; i < y_werte_laenge+1; i++) {
    y_werte_1[i] = 0.0;
    y_werte_2[i] = 0.0;
    y_werte_3[i] = 0.0;
   }

  // Schieberegler anlegen
  frequenz_slider = createSlider(0, 2, 0.5, 0.05);

  // Schieberegler anlegen
  c_slider = createSlider(0, 200, 100, 1);

  // Schieberegler anlegen
  amplitude_slider = createSlider(0, 200, 80, 1);

  // Schieberegler anlegen
  phasendifferenz_slider = createSlider(0, TWO_PI, 0, 0.05);
  
  centerCanvas();
}

function draw() {
  background(255);

  gui_design();
  stoppuhr();
  welle_berechnen();
  welle_rendern(); 
}

function welle_berechnen() {

  // Wellengleichung: y(x;t) = y_max * sin(2*Pi*f(t - x/c))
  // Es gilt Phasengeschwindigkeit = Wellenlänge * Frequenz
  w_frequenz = frequenz_slider.value();
  c_wellengeschw = c_slider.value();
  amplitude = -amplitude_slider.value();
  phasendifferenz_linksrechts = phasendifferenz_slider.value();
  
  // zu einem Zeitpunkt t ist die Phasendifferenz zwischen zwei benachbarten
  // Schwingern gleich 2*Pi*Zeit, die die Welle zum benachbarten Schwinger beötigt
  // also Abstand Schwinger / Phasengeschwindigkeit der Welle
  delta_t = TWO_PI*w_frequenz*(abstand_schwinger / c_wellengeschw);
  var sin_argument = TWO_PI*w_frequenz*(millisek_timer/1000);
  
  for (var i = 0; i < y_werte_laenge+1; i++) {
    // Welle von links, Amplitude != 0, wenn Welle angekommen
    if (sin_argument-(i*delta_t) > 0) {
      y_werte_1[i] = sin(sin_argument-i*delta_t)*amplitude;
    } 
    else 
    { 
      y_werte_1[i] = 0; 
      y_werte_3[i] = 0;
    }
    // Welle von rechts, Amplitude != 0, wenn Welle angekommen
    if (sin_argument-(y_werte_laenge-i)*delta_t+phasendifferenz_linksrechts > 0) {
     y_werte_2[i] = sin(sin_argument-(y_werte_laenge-i)*delta_t+phasendifferenz_linksrechts)*amplitude;    
    } 
    else { 
      y_werte_2[i] = 0;
      y_werte_3[i] = 0;
    }
    y_werte_3[i] = y_werte_1[i] + y_werte_2[i];
  }
  
}

function welle_rendern() {
  var s_radius = 5;
  noStroke();
  var x_offset_welle = 24;
  for (var j = 0; j < y_werte_laenge+1; j++) {
    fill(210,10,10);
    ellipse(j*abstand_schwinger+x_offset_welle, schwingungsebene_y_wert+y_werte_3[j], s_radius, s_radius);    
    fill(10,210,10);
    ellipse(j*abstand_schwinger+x_offset_welle, schwingungsebene_y_wert+y_werte_2[j], s_radius, s_radius);
    fill(10,10,210);
    ellipse(j*abstand_schwinger+x_offset_welle, schwingungsebene_y_wert+y_werte_1[j], s_radius, s_radius);
  }
  
  // Linie, um einen Schwinger leichter zu beobachten
  stroke(120,110,80);
  line(x_offset_welle,schwingungsebene_y_wert,x_offset_welle,schwingungsebene_y_wert+y_werte_1[0]);
  line(x_offset_welle+wellenlaenge,schwingungsebene_y_wert,x_offset_welle+wellenlaenge,schwingungsebene_y_wert+y_werte_1[floor(wellenlaenge/abstand_schwinger)]);  
  // Wellenlänge markieren
  if (w_frequenz != 0) {
      wellenlaenge = c_wellengeschw / w_frequenz;
  }
  else {
     wellenlaenge = 0;
  }
  stroke(120,110,80);
  line(x_offset_welle,schwingungsebene_y_wert+30,x_offset_welle+wellenlaenge,schwingungsebene_y_wert+30);
}

function start_stopp() {
  if (bool_startstopp == 1) { 
    bool_startstopp = 0;
    bool_pause = 1;
  } 
  else { 
    bool_startstopp = 1;
    bool_pause = 0;
  }
}

function stoppuhr_reset() {
  if (bool_startuhr_reset == 1) { 
    bool_startuhr_reset = 0;
    bool_startstopp = 0;
    bool_pause = 0;
  } 
  else { 
    bool_startuhr_reset = 1;
  }
}

function stoppuhr() {
  millisek_seit_appstart = millis();
  sek_seit_appstart = millis()/1000; 
  min_seit_appstart = millis()/1000/60;

  if(bool_startstopp == 0){   
    millisek_neustart = millisek_seit_appstart;
    sek_neustart = sek_seit_appstart;
    min_neustart = min_seit_appstart;
  }
  
  if(bool_startstopp == 1){   
    millisek_timer = millisek_seit_appstart - millisek_neustart;
    sek_timer = sek_seit_appstart - sek_neustart;
    min_timer = min_seit_appstart - min_neustart;
    
    millisek_pause = millisek_timer;
    sek_pause = sek_timer;
    min_pause = min_timer;
  }
  
  if (bool_startstopp == 0 && bool_pause == 1){
    millisek_timer = millisek_pause;
    millisek_neustart = millisek_seit_appstart - millisek_pause;
    
    sek_timer = sek_pause;
    sek_neustart = sek_seit_appstart - sek_pause;
    
    min_timer = min_pause;
    min_neustart = min_seit_appstart - min_pause;
  }
  
  if (bool_startuhr_reset == 1){ 
      millisek_neustart = millisek_seit_appstart;
      millisek_timer = millisek_timer_aufnull;
      
      sek_neustart = sek_seit_appstart;
      sek_timer = sek_timer_aufnull;
      
      min_neustart = min_seit_appstart;
      min_timer = min_timer_aufnull;
      
      bool_startuhr_reset = 0;
      bool_pause = 0;
    } 
    
    //auf modulo umstellen, problem 0 % 60 == 0
    if (sek_timer > 1) {
        if (floor(sek_timer % 60) == 0) {
          sek_neustart = sek_seit_appstart;
          sek_timer = sek_timer_aufnull;
        }
    }
  
  //view
  fill(0);
  textSize(20);
  text(nf(int(min_timer),2) + ":" + nf(int(sek_timer%60),2) + ":" + int(millisek_timer%1000), 25, 100);
}


function gui_design() {
  stroke(22, 148, 202);
  strokeWeight(6);
  noFill();
  rect(0+3,0+3,width-6,height-6);
  line(0,50,width,50);
  
  textSize(26);
  noStroke();
  fill(0);
  text("Wellenmaschine",15,38);
  
  stroke(22, 148, 202);
  strokeWeight(3);
  line(5, schwingungsebene_y_wert, width-5, schwingungsebene_y_wert);
  
  noStroke();
  textSize(17);
  fill(0);
  text("Frequenz in Hz: " + frequenz_slider.value(), 310, 90);
  text("Phasengeschw. in Pixel/s: " + c_slider.value(), 310, 120);
  text("Amplitude in Pixel: " + amplitude_slider.value(), 310, 150);
  text("Phasendiff. links/rechts: " + phasendifferenz_slider.value(), 310, 180);
}