# WindowKill JavaScript clone

## Členovia tímu

-   Martin
-   Tobias

## Prehľad projektu

> _WindowKill je jednoduchá strieľačka, ale herné okno sa stále zmenšuje. Strieľaj to rohov, aby sa okno úplne nezatvorilo, medzitým, ako bojuješ s nepriateľmi a bossmi v ich vlastných oknách._ - [Steam](https://store.steampowered.com/app/2726450/Windowkill/)

WindowKill je strieľačka pre jedného hráča, hrá sa v okne so začiatočnou veľkosťou 400x400 pixelov, ktoré sa postupne zmenšuje. Neskôr sa začnú objavovať nepriatelia a okno sa bude rýchlejšie zmenšovať. Cieľom tohto projektu je vytvoriť plne funkčný _klon_ tejto hry pomocou HTML, CSS, JavaScriptu a následné exportovanie hry ako plne funkčnej desktopovej aplikácie pre Windows, Linux a MacOS nám umožní framework [Tauri 2.0](https://v2.tauri.app/) (áno, je tu použitý Rust na backend, ALE jeho použitie sa dá minimalizovať alebo úplne vynechať).

## Priebeh hry

-   Po spustení hry sa okamžite začne okno zmenšovať
-   Hráč musí strieľať to hrán okna, aby ho zväčšil v danom smere
-   Hráč ostáva umiestnený približne v strede obrazovky, nie okna
-   V priebehu hry sa objavujú nepriatelia, ktorých musí hráč eliminovať alebo mu uberú životy
-   Čím dlhšie je hráč v hre, tým rýchlejšie sa okno zmenšuje a objavujú sa silnejší nepriatelia
-   Akonáhle sa hráča dotkne akákoľvek hrana okna alebo príde o všetky životy, hra skončila

## Funkčné požiadavky

### Nastavenia hry

-   Možnosť upravovať postavu
-   Úprava náročnosti:
    -   ==Preddefinované náročnosti (EASY, MEDIUM, HARD, IMPOSSIBLE)==
    -   _Neskôr:_
        -   _možnosť zmeniť rýchlosť zmenšovania okna_
        -   _väčší počet a rýchlosť objavovania sa nepriateľov_
        -   _sila, akou sa okno zmenšuje_
        -   _sila, akou hráč okno zväčšuje_
-   Nastavenie ukladania skóre
-   Zobrazenie a úprava klávesových skratiek

### Používateľské rozhranie

-   Jednoduchá úvodná obrazovka s tlačidlami pre spustenie, otvorenie nastavení a ukončenie hry
-   Jednoduchá obrazovka pre koniec hry zobrazujúca aktuálne a najlepšie skóre. Rozdielna pre nové najlepšie skóre. Možnosti pre reštartovanie alebo ukončenie
-   Zobrazenie času, ktorý uplynul od začiatku hry
-   Zobrazenie životov hráča
-   Jednoduché menu pri zastavení hry
-   ==Na všetky zobrazenia/skrytia použitá plynulá animácia==

### Mechaniky hry

-   Náročnosti hry budú ovplyvňovať:
    -   Rýchlosť a silu zmenšovania okna
    -   Rýchlosť a silu striel hráča
    -   Vlastnosti nepriateľov
-   Vytváranie nepriateľov na základe náročnosti:
    -   Môžu sa rýchlejšie pohybovať, uberať viac životov alebo mať viac životov
-   Logika pre [[README#Nastavenia hry|Nastavenia hry]]
-   Logika pre [[README#Používateľské rozhranie|Používateľské rozhranie]]
-   Ukladanie najlepšieho skóre do súboru
-   Ukladanie nastavení do súboru
-   Ukladanie úspechov hráča do súboru
-   Prispôsobenie počiatočnej veľkosti veľkosti obrazovky
-   Životy hráča - nepriatelia pri kolízii s hráčom uberú daný počet životov (alebo všetky)
-   Klávesové skratky pre kontrolu hry
    -   ESC pre pozastavenie hry
-   Úspechy hráča - pravdepodobne zo Steamu
-   _Neskôr:_
    -   _Viacero synchronizovaných okien_

### Reštartovanie hry

-   Hráč bude mať možnosť reštartovať hru pri prehre alebo predčasne pri pozastavení hry
-   Veľkosť okna, hracia plocha, skóre by sa malo resetovať

### Počítanie skóre

-   Skóre sa bude počítať z počtu _eliminovaných nepriateľov_ a _času nažive_

### Chyby nájdené pri PoC

-   Okno sa vizuálne zasekáva pri súčasnom zväčšovaní aj zmenšovaní
-   Zmenšovanie sa celkovo zastaví keď sa okno zväčšuje

### Ostatné

-   Soundtrack

##  Výzvy a úvahy

- Zabezpečenie plynulej hry a predídenie podvádzaniu cez konzolu
- Vytvorenie jednoduchého, vizuálne atraktívneho používateľského rozhrania

## Záver

> Projekt WindowKill predstavuje ambiciózny pokus o vytvorenie interaktívnej arkádovej hry s unikátnym mechanizmom meniaceho sa herného priestoru. Implementovaný ako JavaScript klon originálnej hry, projekt demonštruje komplexný prístup k hernému dizajnu a technickej realizácii.
> 
> Počas vývoja dosiahneme významný pokrok vo viacerých oblastiach:
> 
> 1. **Implementované funkcionality**:
>     - Základná herná mechanika s meniacim sa oknom
>     - Systém nepriateľov a kolízií
>     - Rôzne úrovne náročnosti
>     - Používateľské rozhranie s animáciami
>     - Systém ukladania skóre a nastavení
> 1. **Technické dosiahnutia**:
>     - Úspešná integrácia Tauri frameworku pre desktopovú aplikáciu
>     - Implementácia cross-platformového riešenia
>     - Optimalizácia výkonu pre plynulý herný zážitok
> 1. **Plánované vylepšenia**:
>     - Rozšírenie herných mechaník
>     - Vylepšenie vizuálnej stránky
>     - Pridanie zvukových efektov
>     - Implementácia viacerých herných módov
> 
> Projekt predstavuje komplexný prípad použitia webových technológií na vytvorenie natívnej herného zážitku. Úspešne kombinuje HTML/CSS/JavaScript pre frontend a Rust pre backend cez Tauri framework, čím demonštruje možnosť vytvárať výkonné herné aplikácie pomocou webových technológií.
> 
> Projekt nie je len presnou kópiou originálu, ale tiež pridaním vlastných inovácií a vylepšení, čo potvrdzuje vysokú kvalitu implementácie.
> 
> Dokumentácia projektu poskytuje detailný náhľad do vývojového procesu a slúži ako cenný zdroj pre budúcich vývojárov, ktorí by chceli implementovať podobné herné mechaniky alebo využiť Tauri framework pre svoje projekty.

## To Do List

Zhrnutie projektu to jednotlivých bodov

-  [ ] UI
    -   [x] Game start
    -   [x] Game end
        -   [x] Different for new best score
    -   [x] Settings menu
    -   [x] Score counter & timer
    -   [ ] Pause menu
    -   [ ] Animations
        -   [ ] Hover FX
    -   [ ] Set app icon
-   [ ] Mechanics
    -   [ ] Difficulties
        -   [ ] Faster shrinking
        -   [ ] Shrinking power
        -   [ ] More enemies
        -   [ ] Slower fire rate
        -   [ ] Player power
        -   [ ] ? Lost focus - faster shrinking
        -   [ ] Impossible mode - transparent window
    -   [ ] Spawn enemies
        -   [ ] Controlled by difficulties
            -   [ ] Faster movement
            -   [ ] More health
            -   [ ] Bigger damage
    -   [ ] Settings
        -   [x] Player options - color change
        -   [ ] Difficulties
            -   [x] Predefined options
            -   [ ] ? Separate settings for each game aspect
        -   [x] Save options
        -   [ ] Shortcuts customization & display
    -   [ ] UI buttons
    -   [ ] Save
        -   [x] Best score
            -   [ ] ? Encrypt file
        -   [x] Settings
        -   [ ] Achievements
    -   [ ] Dynamic start size
    -   [ ] Dynamic window size
    -   [ ] Players health - enemies deal damage
    -   [ ] Keyboard shortcuts
        -   [x] Disable default shortcuts ! at end also dev tools
        -   [ ] ESC to open pause menu
    -   [ ] Achievements (pravdepodobne zo Steamu)
        -   [ ] get 37 monitors and unlock the Open World 
    -   [x] Game restart
    -   [x] Score counter
    -   [ ] ? Multiple windows - [little help here](https://www.youtube.com/watch?v=3Hye_47c0Pc)
    -   [ ] ? Game modes
	       - [ ] Player stays in center of screen (default - currently working on)
		   - [ ] Player movement allowed
-   [ ] Other
    -   [ ] ? Good Soundtrack
-   [ ] ! Fix
    -   [ ] !! Correctly set window size on restart
    -   [ ] Fix glitches on resize
    -   [ ] Shrinking stops when resizing
    -   [ ] Window flickering when resizing
    -   [ ] !! On Windows, when using 125% or higher scaling, the window when game is started moves to bottom right corner of the screen and triggers game over

## Development

### Verzie

- Pri zmene verzie projektu je potrebné zmeniť číslo verzie v súbore `package.json`, `src-tauri/tauri.conf.json` a `src-tauri/Cargo.toml`.

### Predpríprava

- [Inštalácia NodeJS](https://nodejs.org/en/download)
- [Inštalácia Rust](https://www.rust-lang.org/tools/install)

### Spustenie projektu

```
npm run tauri dev
```