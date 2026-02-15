# Configuration de la Transcription Automatique

## Vue d'ensemble

La transcription automatique permet de transcrire les enregistrements audio **même si l'utilisateur ferme son navigateur ou éteint son ordinateur** après l'upload.

## Architecture

```
┌─────────────────┐
│  User uploads   │
│  recording      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  INSERT into recordings │
│  (status = 'pending')   │
└────────┬────────────────┘
         │
         ▼ (Database Trigger)
┌─────────────────────────┐
│  trigger_auto_          │
│  transcription()        │
└────────┬────────────────┘
         │
         ▼ (HTTP POST via pg_net)
┌─────────────────────────┐
│  Edge Function:         │
│  transcribe             │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  OpenAI Whisper API     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  INSERT into transcripts│
│  UPDATE recordings      │
│  (status = 'completed') │
└─────────────────────────┘
```

## Configuration requise

### 1. Activer l'extension pg_net

Dans le **SQL Editor** de Supabase :

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 2. Configurer les variables d'environnement

Dans **Project Settings > Edge Functions > Secrets**, ajoutez :

```
app.settings.supabase_url=https://[VOTRE_PROJECT_REF].supabase.co
app.settings.service_role_key=[VOTRE_SERVICE_ROLE_KEY]
```

⚠️ **IMPORTANT** : Utilisez la **Service Role Key** (pas l'anon key) car elle a les permissions nécessaires pour appeler les Edge Functions.

### 3. Exécuter le schéma SQL

Le fichier `schema.sql` contient déjà :
- La fonction `trigger_auto_transcription()`
- Le trigger `auto_transcribe_on_upload`

Exécutez-le dans le SQL Editor si ce n'est pas déjà fait.

## Comment ça marche ?

1. **L'utilisateur upload un enregistrement** via le frontend
2. **Le frontend insère un record** dans la table `recordings` avec `transcription_status = 'pending'`
3. **Le trigger se déclenche automatiquement** dès l'insertion
4. **Le trigger appelle la Edge Function** `transcribe` via HTTP POST (pg_net)
5. **La Edge Function s'exécute de manière asynchrone** :
   - Télécharge l'audio depuis Supabase Storage
   - Envoie à OpenAI Whisper
   - Insère les segments de transcription
   - Met à jour le statut à `'completed'`
6. **L'utilisateur voit le résultat** quand il revient (même après avoir fermé son ordinateur !)

## Alternative : Supabase Database Webhooks

Si vous préférez ne pas utiliser `pg_net`, vous pouvez configurer un **Database Webhook** dans Supabase Dashboard :

1. Allez dans **Database > Webhooks**
2. Créez un nouveau webhook :
   - **Table** : `recordings`
   - **Events** : `INSERT`
   - **HTTP Request** :
     - URL : `https://[PROJECT_REF].supabase.co/functions/v1/transcribe`
     - Method : `POST`
     - Headers : `Authorization: Bearer [SERVICE_ROLE_KEY]`
   - **Filters** : `transcription_status = 'pending'`

## Vérification

Pour tester que ça fonctionne :

1. Uploadez un enregistrement depuis l'app
2. Vérifiez dans **Table Editor > recordings** que le statut passe de `pending` → `processing` → `completed`
3. Fermez votre navigateur pendant le processing
4. Rouvrez et vérifiez que la transcription est complète ✅

## Debugging

Si la transcription ne se déclenche pas automatiquement :

1. **Vérifiez les logs de la Edge Function** dans **Edge Functions > transcribe > Logs**
2. **Vérifiez l'extension pg_net** : `SELECT * FROM pg_extension WHERE extname = 'pg_net';`
3. **Vérifiez les settings** : `SHOW app.settings.supabase_url;`
4. **Testez manuellement le trigger** :
   ```sql
   SELECT trigger_auto_transcription();
   ```

## Désactivation du trigger (si nécessaire)

Si vous voulez revenir au mode manuel :

```sql
DROP TRIGGER IF EXISTS auto_transcribe_on_upload ON recordings;
```

Pour le réactiver :

```sql
CREATE TRIGGER auto_transcribe_on_upload
  AFTER INSERT ON recordings
  FOR EACH ROW
  WHEN (NEW.transcription_status = 'pending')
  EXECUTE FUNCTION trigger_auto_transcription();
```
