# Formular Portret Medieval - Turist în Transilvania

Acest proiect conține un formular web în stil medieval pentru generarea de portrete AI pentru turiști care vizitează bisericile fortificate din Transilvania.

## Structura proiectului

- `index.html` - Pagina principală cu formularul
- `style.css` - Stilizarea în temă medievală
- `script.js` - Funcționalitatea de încărcare a imaginilor și trimitere către n8n
- `.env.example` - Exemplu de fișier de configurare
- `.gitignore` - Fișier pentru ignorarea fișierelor sensibile

## Configurare

### Variabile de mediu

Copiați `.env.example` în `.env` și configurați valorile:

```bash
cp .env.example .env
```

Editați `.env` cu valorile dvs.:

```env
WEBHOOK_URL=your_webhook_url_here
DONATION_URL=your_donation_url_here
MAX_IMAGE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/heic,image/heif
```

### Configurare n8n

1. Creați un workflow n8n pentru procesarea formularului
2. Configurați webhook-ul în n8n
3. Adăugați URL-ul webhook-ului în variabila de mediu `WEBHOOK_URL`

## Încărcare pe server

1. Asigurați-vă că `.env` este configurat corect
2. Transferați fișierele pe server
3. Asigurați-vă că `.env` este accesibil în contextul web
4. Testați formularul complet

## Personalizare

- Logo: Înlocuiește URL-ul logo-ului din `index.html` cu logo-ul tău
- Culori: Modifică schema de culori în `style.css`
- Locații: Adaugă sau modifică opțiunile de locație din `index.html`

## Securitate

- Configurați variabilele de mediu în `.env`
- Nu încărcați `.env` pe GitHub
- Asigurați-vă că `node_modules` și fișierele de log sunt ignorate
- Verificați că toate URL-urile sunt securizate (https)
- Implementați validare server-side pentru date

## Note importante

- Formularul include validare pentru email și încărcare de imagine
- Implementarea actuală folosește variabile de mediu pentru configurare
- Pentru producție, configurați toate variabilele de mediu corespunzător
