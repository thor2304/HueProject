# HueProject
### We control Philips Hue lamps, remotely
This project set out to tackle the issue of noise in the classroom. With a couple of Philips Hue lamps, a Hue bridge and _some_ programming knowledge, we decided to make a system, which listens to the microphone input and controls the lights, according to the level of noise. 

The final project runs on a Raspberry Pi in Node.js. The microphone is connected via USB, and the Pi itself is running the entire show. This means that the Pi itself sends the HTTP requests to the Hue bridge. 

## Dependencies
Projektet kører i Node.js og derfor har vi anvendt nogle forskellige NPM pakker for at få projektet til at virke. Her følger en liste over disse og en kort beskrivelse af hvad de bruges til:

- **mic**
  - _mic_ bruges til at optage lyden fra mikrofonen. Denne pakker laver en midlertidig fil på Pi'en. Filen har formatet raw og er derfor de rå input værdier fra mikrofonen uden noget formatering. 
- **wav-decoder**
  - _wav-decoder_ kan aflæse .wav filer og lave dem om til javascript arrays. Kan ikke aflæse raw filer
- **waveheader**
  - _waveheader_ bruges til at indsætte en header i raw filen, som gør den til en .wav fil. Dette gør at vi nu kan aflæse den midlertidige fil fra mikrofonen.
- **lodash**
  - _lodash_ er et utility library, som har nogle smarte funktioner og værktøjer. I dette projekt anvendes dog kun `_.sum()` funktionen og `_.max()` funktionen. 
- **request**
  - _request_ bruges til at sende HTTP requests til Hue Bridgen

Derudover er vi afhængige af et program/utility, der hedder **SoX**. SoX er det, som muliggør at vores program kan kommunikere med mikrofonen. SoX er ikke en NPM pakke, men derimod et program, som skal installeres på Pi'en, i stil med Node. Mere om det kan findes under afsnittet om _Setup og NPM install_. 

## Hvad kan det, hvad kan det ikke?
Denne installation, kan opfange mikrofon lyd og afgøre, hvornår gennemsnittet af de højeste lyde, inden for _x_ antal sekunder, i lokalet er for høje. Udfra støj niveauet, dæmper Phillips Hue lampen sig, og ved alt for meget støj slukkes den. Når der ikke er noget støj, er lampen tændt med den højeste lys styrke.

Pointen med installationen er at man skal kunne gå ind i et lokale, og få sig et hurtigt overblik over hvor der ikke er larm, så man kan sætte sig et sted hvor der er ro. Dette kræver dog et netværk af Raspberry Pi's der kommunikere sammen. Det har vi ikke haft adgang til i det forløbet, projektet blev lavet i. **Så PT kan en Pi kun lytte til mikrofonen tilknyttet sig selv.**

Systemet kan ikke afgøre hvad der klassificeres som støj. **Systemet er ikke selv-tænkende**. Det er bruger afgjort hvad der er støj. I denne opgave har vi tolket støj som at det er mange høje lyde, over en længere periode, og generelt bare et højt lyd niveau. Systemet beregner gennemsnittet af de højeste lyde inden for et interval af 10 sekunder. Hvis gennemsnittet af de højeste lyde overskrider støjgrænsen, sat af brugeren, tolkes det som støj og systemet reagere tilsvarende.

Man kan ikke ændre hvilken lampe der skal snakkes med gennem API'en, ligesom man kan ikke ændre hvilken Bridge man forbinder til, **hvis man ikke har adgang til kildekoden**. Der er ikke en interface, der kan bruges til ændring af oplysninger nødvendige for et lettere overblik fra brugerens synspunkt. *Dette kunne være en ting, man kunne videreudvikle.*


## API'er i projektet
API står for Aplication Programming Interface. Philips har udviklet et API, som man har adgang til gennem deres Hue Bridge. API'et kører på selve Bridgen. Dette er lidt forskelligt fra hvad vi er vant til, eftersom API'er normalt kører på en stor server et sted ude i verden. Funktionelt har det dog ikke nogen indflydelse på hvordan man interagerer med selve API'et.

Det har dog alligevel haft en smule indflydelse på projektet/projektforløbet. Det skyldes at Hue Bridgen ikke kan håndtere store mængder HTTP-Requests indenfor kort tid. 
I starten af projektet blev vores bridge overvældet af de mange HTTP-requests fordi der var 20 elever i klassen, og et par stykker af dem sendte alt for mange requests. Dette skyldes at det er nemt at komme til at sende en besked for hver frame og så er det pludselig 60 requests i sekundet. Blot fra én elev. Når bridgen får for mange beskeder, så lader den bare være med at gøre noget. Vi har læst os frem til at **Bridgen kan kun håndtere _10_ beskeder i sekundet** og ved mere end det begynder den at opføre sig mærkeligt. 

For at kommunikere med API'et skal man bruge en Access-key, Philips kalder dette for et username. Deres username fungerer dog som en nøgle til API'et. I vores projekt findes allerede et username, men dette virker udelukkende til vores bridge (APi'et kører på bridgen, _remember_). Derfor skal man som ny bruger selv generere en Access-key til ens egen bridge. [En guide til dette kan findes her](https://developers.meethue.com/develop/get-started-2/ "Philips API dokumentation"). _Læs dog afsnittet nedenfor **inden** du kaster dig ud i dette_.  

Til ovenstående har vi nogle få bemærkninger angående måden bridgen håndterer nye usere og usernames. Vores erfaring er at man godt kan dele usernames på tværs af enheder. Dog skal enhederne være af samme type. Det vil sige at man ikke kan hente et brugernavn fra bridgen med en computer og derefter benytte dette på en Raspberry Pi. Man kan dog godt hente et brugernavn fra en pc og anvende dette på en anden. Løsningen på dette er altså at man skal anvende selve ens Raspberry Pi til at hente den access key, man skal bruge til projektet. 
Vores teori er altså at der er forskellige kategorier af enheder på Bridgen og at enhede fra samme kategori godt kan dele username, mens enheder fra forskellige kategorier ikke kan. Og at en PC og en Raspberry Pi ikke er i samme kategori. Derudover har vi også prøvet med en esp8266 som er en mini arduino med wifi-chip. Denne er ikke i samme kategori som hverken PC eller Raspberry Pi. 

#### Opsummering af hvilke enheder, som kan dele usernames/Access-keys
- Et username genereret på en computer kan _godt_ anvendes på en anden computer
- Et username genereret på en Raspberry Pi kan _godt_  anvendes på en anden Raspberry Pi
- Et username genereret på en Raspberry Pi kan __ikke__ anvendes på en computer 
- Et username genereret på en computer kan __ikke__ anvendes på en Raspberry Pi
- Et username genereret på en computer kan __ikke__ anvendes på en esp8266
- Et username genereret på en Raspberry Pi kan __ikke__ anvendes på en esp8266


## Brugen af produktet / anvendelsen



## Setup, inklusive NPM install
Inden projektet kan komme til at køre på en frisk Raspberry Pi er der lige nogle ting man skal installere først. I det følgende forudsætter vi at man har en helt frisk installation af styresystemet _(vores Pi kører på Raspbian)_. 

1. Hardware
    Det første vi skal have styr på er at alt er koblet til ens Raspberry Pi, vores erfaring er at det bedste er at have alt forbundet til ens Pi inden den tændes. Det vil sige, forbind en skærm, tastatur, mus og vigtigst: mikrofonen. 
    Vores mikrofon var en USB mikrofon og derfor ved vi ikke hvordan programmet vil fungere ved en anden type mikrofon. 

2. Installation af SoX
    SoX kan installeres gennem enten grafiske værktøjer, eksempelvis direkte fra deres hjemmeside [https://sourceforge.net/projects/sox/files/sox/](https://sourceforge.net/projects/sox/files/sox/ "Deres egen linkede sted at hente SoX"). 

    Man kan også gøre det gennem en grafisk pakke manager [Demonstreret her](https://www.youtube.com/watch?v=SexEjlXLSj8 "Youtube video med demonstrationen").

    Den hurtigste og nemmeste måde er dog gennem terminalen. Dette gøres ved at skrive kommandoerne:
    ```s
    sudo apt-get update -y
    sudo apt-get install -y sox
    ```

3. Installation af Node.js
    Dette kan igen enten gøres gennem den primært grafiske værktøj [Følg denne guide for grafisk](https://www.instructables.com/id/Install-Nodejs-and-Npm-on-Raspberry-Pi/ "Installation gennem nodejs.org")
    Man kan også gøre det gennem commandline og dette beskrives i [denne guide](https://thisdavej.com/beginners-guide-to-installing-node-js-on-a-raspberry-pi/ "lang guide, rul til relevant afsnit") man skal bare rulle ned til det afsnit, som har overskriften __Install Node.js__

4. Hent filerne
    Dette gør man enten ved bare at hente dem fra Githubs grafiske interfaace eller man kan hente dem ved hjælp af Git. Dette step siger lidt sig selv (den grønne knap på siden, med teksten "clone or download"). 
    
    __Notér og kopier__ fil stien til denne mappe da vi skal bruge stien i næste trin. 

5. NPM install 
    vi skal nu åbne terminalen og navigere over i mappen hvor filerne ligger, dette gøres med kommandoen:
    ```s
    cd <din sti til mappen>
    ```
    I denne mappe kan vi nu køre kommandoen 
    ```s
    npm install
    ```
    Dette vil installere de npm pakker, som vi har bedt om i package filen. Nu er vi klar til at starte projektet som det sidste trin.
 
6. Kør filen
    For at køre filen bruger vi kommandoen `node <filnavn>` på filen `ras.js`:
   ```s
    node ras.js
    ```
    For at afslutte node skal man trykke ctrl+c, det er meget vigtigt at man ikke trykker på andre taster mens `ras.js` kører da det får mikrofonen til at gå i kage. Hvis man gør dette har vi haft størst succes ved at genstarte vores Raspberry Pi med det samme. 

## Derfor har dette projekt opfyldt kravene



## Næste skridt
