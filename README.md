# CyberEdu — Platformë për sigurinë kibernetike

Prototip UI/UX në shqip për të mësuar zakone më të sigurta online. Ky version demonstrues përfshin hyrje lokale, panelin e studentit, pesë mësime, kuiz, mentore me përgjigje të paracaktuara dhe këshilla sigurie.

## Nise lokalisht

1. Hape këtë depo në VS Code.
2. Hape `Platforme_Siguria_Kibernetike_AI/index.html` në shfletues, ose zgjidh **CyberEdu: Hap në Chrome** te Run and Debug.
3. Krijo profil prove. Profili dhe progresi ruhen në `localStorage` të atij shfletuesi.

Nuk ka hapa instalimi apo varësi build-i. Fontet përdorin Google Fonts kur ka internet dhe fontet e sistemit si alternativë.

## Struktura

```text
.
├── .vscode/launch.json
├── docs/
│   ├── plan-pune.md
│   └── wireframe.md
└── Platforme_Siguria_Kibernetike_AI/
    ├── index.html
    ├── style.css
    ├── app.js
    └── README.md
```

## Prototipi dhe kufijtë

Shih [wireframe-in dhe përshkrimin e ekraneve](docs/wireframe.md) dhe [planin e punës](docs/plan-pune.md). Mentorja nuk është model AI: ajo jep përgjigje të përgatitura. Hyrja është demonstrim lokal, jo autentifikim për përdorim real. Nuk ka server ose bazë të dhënash; profili dhe progresi nuk sinkronizohen mes pajisjeve. Mos përdor fjalëkalim real.

## Mjedisi dhe hapat e ardhshëm

Prototipi punon si faqe statike me HTML, CSS dhe JavaScript të thjeshtë. Për fazën pasuese duhet zgjedhur dhe konfiguruar një backend dhe bazë të dhënash, pastaj të zëvendësohet ruajtja lokale me API dhe autentifikim të sigurt. Asnjë sekret apo kredencial databaze nuk mbahet në klientin e shfletuesit.
