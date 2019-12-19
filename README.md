# HueProject
### We control Philips Hue lamps, remotely
This project set out to tackle the issue of noise in the classroom. With a couple of Philips Hue lamps, a Hue bridge and _some_ programming knowledge, we decided to make a system, which listens to the microphone input and controls the lights, according to the level of noise. 

The final project runs on a Raspberry Pi in Node.js. The microphone is connected via USB, and the Pi itself is running the entire show. This means that the Pi itself sends the HTTP requests to the Hue bridge. 

## Libraries/dependencies
Vi har anvendt nogle forskellige libraries for at få projektet til at virke. Her følger en liste over disse og en kort beskrivelse af hvad de bruges til:



- mic
  - _mic_ bruges til at optage lyden fra mikrofonen. Denne pakker laver en midlertidig fil på Pi'en. Filen har formatet raw og er derfor de rå input værdier fra mikrofonen uden noget formatering. 
- wav-decoder
  - _wav-decoder_ kan aflæse .wav filer og lave dem om til javascript arrays. Kan ikke aflæse raw filer
- waveheader
  - _waveheader_ bruges til at indsætte en header i raw filen, som gør den til en .wav fil. Dette gør at vi nu kan aflæse den midlertidige fil fra mikrofonen.
- lodash
  - _lodash_ er et utility library, som har nogle smarte funktioner og værktøjer. I dette projekt anvendes dog kun `_.sum()` funktionen og `_.max()` funktionen. 

- request
  - 



## API'er


## Hvad kan det?


## Hvad kan det ikke?



## Brugen af produktet / anvendelsen


## Setup, inklusive NPM install


## Derfor har dette projekt opfyldt kravene


