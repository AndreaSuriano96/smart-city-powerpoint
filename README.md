# Smart City 3D per PowerPoint

La simulazione interattiva è integrata nella slide finale della presentazione. La V1.9 fa occupare alla simulazione tutta la slide e avvicina la vista iniziale della città. Il titolo e il marchio BAIT restano nella pagina interattiva. Richiede PowerPoint per Windows e Internet per caricare la pagina pubblica e le API di Office.

## Configurazione su Windows

Il catalogo condiviso è il metodo Microsoft di sideload/test su Windows, non una pubblicazione su Microsoft Marketplace.

1. Condividere la cartella `docs` con il nome `SmartCityAddins` e accesso in lettura per il proprio utente Windows. Il percorso atteso su questo computer è `\\NOTEBOOK-AS\SmartCityAddins`.
2. In PowerPoint aprire **File > Opzioni > Centro protezione > Impostazioni Centro protezione > Cataloghi di componenti aggiuntivi attendibili**. Aggiungere il percorso del catalogo e attivare **Mostra nel menu**. In alternativa, importare `Aggiungi-catalogo-attendibile.reg`.
3. Chiudere PowerPoint, eseguire `Rimuovi.ps1` per cancellare la vecchia registrazione di sviluppo e riaprire PowerPoint.
4. Aprire la presentazione V1.5 o successiva. Copiare soltanto il PPTX su un altro PC non installa il componente: configurare il catalogo anche lì.

Se una policy scolastica impedisce la condivisione o la configurazione del catalogo, rivolgersi all'amministratore di sistema. Per PDF e lettori che non supportano gli add-in resta visibile un'anteprima statica.

## Controlli

- **Città, Incrocio, Parco:** cambia inquadratura; trascina per ruotare e usa la rotella per lo zoom.
- **Traffico:** varia l'afflusso e osserva code e semafori.
- **Acqua:** sotto il 32% di umidità parte l'irrigazione; si ferma al 65%. La pioggia sospende i getti.
- **Luce:** sotto il 30% si accendono i lampioni.
- **Pausa:** ferma o riprende la simulazione.

## Pubblicazione e sorgenti

La pagina è pubblicata con GitHub Pages: https://andreasuriano96.github.io/smart-city-powerpoint/. Il manifest usa `Restricted`. La simulazione usa dati didattici e non trasmette i valori dei controlli.

L'architettura è adattata dal progetto PeopleWorks Live Website Viewer (MIT): https://github.com/peopleworks/powerpointwebviewer. L'integrazione PPTX usa il modello Microsoft PowerPointPresentationWithContent: https://github.com/OfficeDev/Office-Addin-Scripts.
