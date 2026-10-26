# Smart City 3D per PowerPoint

Componente di contenuto gratuito per PowerPoint desktop Windows. La simulazione si esegue dentro la slide: traffico e semafori, irrigazione, pioggia e luce restano interattivi. Non occorrono abbonamenti. Richiede Internet per caricare il componente da GitHub Pages e le API di Microsoft Office.

## Installazione sul PC della presentazione

1. Estrai il pacchetto in una cartella stabile.
2. Esegui Installa.ps1 con PowerShell per registrare il solo manifest di Smart City 3D nel profilo corrente. Se la scuola gestisce o blocca i componenti aggiuntivi, rivolgiti all'amministratore; non modificare le sue restrizioni.
3. Apri la presentazione V1.4 con PowerPoint. Se era già aperta, riaprila. All'ultima slide, avvia la presentazione e interagisci con la città.
4. Eventuali richieste di fiducia di Office vanno esaminate e accettate dall'utente.

La registrazione usa il caricamento locale per sviluppo documentato dal progetto Microsoft Office-Addin-Scripts. Questo è un componente didattico personalizzato, non un prodotto certificato Microsoft Marketplace. Non modifica impostazioni delle macro, certificati, firewall o criteri di protezione. L'installazione è necessaria su ogni PC che deve eseguire la simulazione. Copiare soltanto il PPTX non installa il componente. Per rimuovere la registrazione esegui Rimuovi.ps1.

## Controlli

- Città, Incrocio, Parco: inquadrature 3D. Trascina per ruotare, rotella per lo zoom.
- Traffico: varia l'afflusso e osserva code e fasi semaforiche.
- Acqua: umidità sotto il 32% avvia i getti, il 65% li ferma. Pioggia sospende l'irrigazione.
- Luce: sotto il 30% si accendono i lampioni.
- Pausa: ferma e riprende la simulazione.

## Pubblicazione e sorgenti

La cartella docs viene pubblicata con GitHub Pages: https://andreasuriano96.github.io/smart-city-powerpoint/. Il file manifest.xml identifica una ContentApp per PowerPoint e richiede il livello minimo Restricted. Il componente non legge slide o file, non usa servizi analitici e non trasmette i valori della simulazione. I fornitori dell'hosting e delle API gestiscono le normali richieste di rete.

La presentazione del progetto e i documenti aziendali non fanno parte di questo repository. Il modello 3D e le quantità sono simulazioni didattiche.

Architettura adattata dal progetto PeopleWorks Live Website Viewer (MIT), con contenuto dedicato alla Smart City e senza navigazione a siti arbitrari: https://github.com/peopleworks/powerpointwebviewer. Integrazione PPTX basata sul modello Microsoft PowerPointPresentationWithContent.pptx: https://github.com/OfficeDev/Office-Addin-Scripts.
