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

Derudover er vi afhængige af et program/utility, der hedder **SoX**. SoX er det, som muliggør at vores program kan kommunikere med mikrofonen. SoX er ikke en NPM pakke, men derimod et program, som skal installeres på Pi'en, i stil med Node. Mere om det kan findes under afsnittet om [Setup og NPM install](#setup-inklusive-npm-install "link til afsnit"). SoX, kalder sig selv for _"the swiss army knife of sound"_ og denne bruges af pakken mic til at optage lyd. 

## Hvad kan det, hvad kan det ikke?
Denne installation, opfanger mikrofonlyd og noterer det højeste lydniveau, inden for _x1_ antal sekunder. Dette lydniveau gemmes sammen med de lydniveauer den har observeret indenfor de sidste _x2_ minutter. Hvis støjniveauet er for højt, bliver Philips Hue lampen dæmpet, og hvis støjniveauet er alt for højt slukkes den helt. Når støjniveauet er lavt nok, bliver lampen tændt med den højeste lysstyrke.

Pointen med installationen er at man skal kunne gå ind i et lokale, og få sig et hurtigt overblik over hvor der er larm og hvor der ikke er, så man kan sætte sig et sted hvor der er ro. Dette kræver dog et netværk af Raspberry Pi's der kommunikerer sammen. Det har vi ikke haft adgang til, i første omgang. Så **PT kan en Pi kun lytte til én mikrofon tilknyttet sig selv.**

Systemet kan ikke afgøre hvad der klassificeres som støj. **Systemet er ikke selv-tænkende**. Det afgøres af brugeren hvad der er støj og hvad der ikke er. Mere præcist sagt er der hardcoded en grænse, som afgør hvad der er støj. I denne opgave har vi tolket støj, som at der er mange høje lyde, over en længere periode, og derfor generelt bare et højt lyd niveau. Systemet lytter i 10 sekunder og noterer den højeste lyd den har hørt. Dette lydniveau bliver lagt i et array, og denne process gentages. På baggrund af dette array beregnes gennemsnittet af de højeste lyde indenfor de sidste 2 minutter. Hvis gennemsnittet af de højeste lyde overskrider støjgrænsen, sat af brugeren, tolkes det som støj og systemet reagerer tilsvarende.

Man kan kun ændre hvilken lampe der skal snakkes med, og hvilken Bridge man forbinder til, hvis man har adgang til kildekoden. __Der er ikke et interface__, der kan bruges til nem opsætning af systemet for en ny bruger. *Dette kunne være en ting, man kunne videreudvikle.*


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


## Setup, inklusive NPM install
Inden projektet kan komme til at køre på en frisk Raspberry Pi er der lige nogle ting man skal installere først. I det følgende forudsætter vi at man har en helt frisk installation af styresystemet _(vores Pi kører på Raspbian)_.

__*Følgende foregår på Raspberry Pi'en.*__ Intet foregår på en computer.

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

6. Forbind til Hue
    For at oprette forbindelse til din egen Hue-bridge skal du finde brigdens IP-adresse og få din egen access-key. Dette kan gøres ved at følge [denne guide](https://developers.meethue.com/develop/get-started-2/ "Philips API dokumentation").
    Når du er blevet givet en access-key, skal du åbne `ras.js` og ændre variablen `username` til dit egen access-key. Du skal også ændre variablen `bridgeIP` til din egens bridges IP.
    Du skal desuden nu finde nummeret til den lampe du gerne ville styre. Dette gøres igen på `https://<bridge ip address>/debug/clip.html`, her skal du lave en command `https://<bridge ip address>/api/<username>/lights`, med `GET` metoden. Så vil du få et respone med alle de numre der er tilknyttet din brigde.
    Vælg den lampe du vil bruge systemet til at ændre, og indtast det nummer i variablen: `whichLight` i filen `ras.js`.
    __*Husk at gemme filen!*__

7. Kør filen
    For at køre filen bruger vi kommandoen `node <filnavn>` på filen `ras.js`:
   ```s
    node ras.js
    ```
    For at afslutte node skal man trykke __*ctrl+c*__, _det er **meget vigtigt** at man **ikke** trykker på andre taster mens `ras.js` kører_, da det får mikrofonen til at gå i kage. Hvis man gør dette, har vi haft størst succes ved at genstarte vores Raspberry Pi med det samme. 

## Brugen af produktet / anvendelsen
Når systemet er oppe at køre er der 3 stadier programmet kan være i. Disse er afgjort af de tresholds som er sat i kildekoden. 

1. Der er ikke larm. Der er ikke meget støj i lokalet. :arrow_right: Lampen har den højeste mulige lysstyrke. 

2. Det er støj i lokalet. Det burde være i et interval, hvor der er lidt støj, til meget støj. :arrow_right: Lampen dæmper sig mere, jo mere larm der er.

3. Der er uudholdeligt meget støj i lokalet. :arrow_right: Lampen slukker.


### Til fejlfinding eller mere dybdegående forståelse
I kommandoprompten på Pi'en, der køre programmet, kan man se forskellige console logs. Man kan se:
- Længden af arrayet for det højeste lydniveauer.
- Det højeste lydniveau inden for tidsintervallet.
- Gennemsnittet af de højeste lydniveauer.
- Om gennemsnittet er under, mellem eller over de tresholds.
- `calculatedBrightness` som er en værdi, der beregnes til at styre hvor meget lyset skal dæmpes ved støj.

 _Ved små ændringer i kildekoden, kan flere console logs blive vist. Udkommentationerne (`//`) skal bare fjernes ved_
`// console.log(...)`.


## Derfor har dette projekt opfyldt kravene
I dette projekt skulle vi lave et intelligent system, som både anvender API'er og inteeragerer med den fysiske verden. Pointen var altså at vi skulle have vores kode til at gøre noget udenfor bare vores egen computer. 

Vi tackler punkterne hver for sig og argumenterer for hvorfor vores projekt lever op til de enkelte krav
1. Anvendelse af API
   - Vi kommunikerer til lamperne gennem det API, som Philips har stillet til rådighed på deres Hue Bridge. Det vil sige at for at vi overhovedet kan styre lamperne har vi kommunikation med et API. Vi mener derfor at vi har opfyldt dette krav ved at kommunikere med Philips Hue gennem deres API. 

2. Interaktion med den fysiske verden
   - Dette punkt knytter sig også til Philips Hue. Vi kan påvirke den fysiske verden gennem lamperne. Ved at få lamperne til at tænde og slukke, påvirker vi den fysiske verden. Således opfylder vi altså kravet ved at vi manipulerer med lamper i den fysiske verden.

3. Intelligent system
   - Vores argument for at systemet er intelligent er at det opfører sig forskelligt alt efter hvad lydniveauet er. Når lydniveauet er under en bestemt grænse er systemet ligeglad med hvad det helt præcist er, lampen er bare helt tændt. Når lydniveauet så når op i midter-regionen er det meget afhængigt af præcis hvad gennemsnittet er. Når lydniveauet så er over en øvre grænse vil systemet igen være ligeglad med hvad gennemsnittet er helt præcist, og lampen vil bare være helt slukket. 


## Næste skridt
- Hvad ville vi lave hvis vi havde en uge mere?
  - Vi ville lave en setup-del, som automatisk kan hjælpe brugeren med at skaffe et username, da det er en besværlig del af at implementere systemet med en ny bridge. Hvis muligt, ikke bare skaffe, men også ændre det, så man ikke behøver at gå til kildekoden.
  - Vi vil lave et interface, som gør det let for brugeren at opsætte forbindelserne til Hue-lamperne og Bridgen. Vi vil gerne gøre så brugeren kan se, hvilke lamper der er forbundet og vælge udfra en liste. Brugeren skal kunne indtaste brigdens IP-addresse i et felt, evt på en webside kørt at Pi'en.
  - Vi ville gerne tilpasse vores tresholds for hvad der er støj. *Det har været ret svært for os at finde ud af, hvad vi mener er støj. Det virker som om at mikrofonen opfanger forskellige toner forskelligt. Det har gjort at vi har haft lidt svært ved at finde ud af hvad der laver, det vi tolker som støj.*
  

- Hvordan kan man tage projektet til en ny højde?
  - Som nævnt i overstående afsnit, er definitionen af støj hardcoded af brugeren. Det kunne være smart at få integreret machine-learning til dette i stedet. Så man kan træne en maskine til at tolke hvad støj er. På den måde kan man få et system, som er bedre til at vurdere støjniveauet. 
  - Oprette et netværk af mikrofoner. Vi kunne godt tænke os at det var muligt at vi knyttede flere mikrofoner til en Raspberry Pi. Hvis det ikke er muligt med flere mikrofoner, havde vi tænkt at man kunne installere flere Pi's med én mikrofon hver. Disse Pi's skulle så kommunikere til en central Pi, eller anden server som skulle håndtere hver Pi og dets inputs og derefter stå for at styre Hue-lamperne. Hver lampe kunne så svare til en mikrofon. 


  ## Thanks for holding out and reading it all :shipit:
  #### *Simon gav os lov til at skrive mere end 2 sider* :stuck_out_tongue_winking_eye:
  Han vidste nok ikke helt hvad han sagde ja til.
  _(hvis i er nysgerrige, så er der 15,300 tegn inklusive mellemrum i filen)_

  # Project created by Frederik Greve Petersen and Thor Malmby Jørgin
