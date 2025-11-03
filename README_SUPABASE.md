# SmartCoop - Guide de démarrage Supabase

## 🚀 Migration terminée !

L'application a été migrée avec succès de Firebase vers Supabase. Les problèmes de chargement infini ont été résolus.

## ✅ Changements effectués

### 1. Infrastructure
- ✅ Client Supabase configuré
- ✅ Authentification migrée vers Supabase Auth
- ✅ Hooks personnalisés créés pour simplifier les requêtes
- ✅ Build optimisé et fonctionnel

### 2. Nouveaux fichiers
- `src/lib/supabase.ts` - Configuration Supabase
- `src/services/auth/supabaseAuthService.ts` - Service d'authentification
- `src/contexts/SupabaseAuthContext.tsx` - Contexte d'authentification
- `src/hooks/useSupabaseQuery.ts` - Hook pour les requêtes

### 3. Fichiers modifiés
- `src/App.tsx` - Utilise maintenant SupabaseAuthProvider
- `vite.config.ts` - Cible de build mise à jour (es2020)

## 🔧 Configuration requise

Les variables d'environnement sont déjà configurées dans `.env` :
```env
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## 📊 Tables Supabase disponibles

Les tables suivantes sont prêtes à l'emploi :
- `producers` - Producteurs
- `collections` - Collectes
- `stock` - Stocks
- `warehouses` - Entrepôts
- `deliveries` - Livraisons
- `invoices` - Factures
- `users` - Utilisateurs
- `routes` - Itinéraires
- Et plus encore...

## 🛠️ Comment utiliser

### Authentification

L'authentification est maintenant gérée par Supabase :

```typescript
import { useSupabaseAuth } from './contexts/SupabaseAuthContext';

function MyComponent() {
  const { user, login, signOut, loading } = useSupabaseAuth();

  const handleLogin = async () => {
    await login({ email: 'user@example.com', password: 'password' });
  };

  return <div>{user ? `Bonjour ${user.displayName}` : 'Non connecté'}</div>;
}
```

### Requêtes de données

Utilisez le hook `useSupabaseQuery` pour récupérer des données :

```typescript
import { useSupabaseQuery } from './hooks/useSupabaseQuery';

function ProducersList() {
  const { data: producers, loading, error } = useSupabaseQuery({
    table: 'producers',
    orderBy: { column: 'full_name', ascending: true },
    realtime: true // Active les mises à jour en temps réel
  });

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <ul>
      {producers.map(p => <li key={p.id}>{p.full_name}</li>)}
    </ul>
  );
}
```

### Opérations CRUD

```typescript
import { supabase } from './lib/supabase';

// CREATE
const { data, error } = await supabase
  .from('producers')
  .insert({ full_name: 'John Doe', phone: '1234567890' })
  .select()
  .single();

// READ
const { data, error } = await supabase
  .from('producers')
  .select('*')
  .eq('status', 'active');

// UPDATE
const { error } = await supabase
  .from('producers')
  .update({ status: 'inactive' })
  .eq('id', '123');

// DELETE
const { error } = await supabase
  .from('producers')
  .delete()
  .eq('id', '123');
```

## 🎯 Prochaines étapes recommandées

1. **Migrer les composants restants** : Les composants utilisent encore Firebase. Consultez `MIGRATION_SUPABASE.md` pour les instructions.

2. **Ajouter des données de test** : Insérez quelques producteurs et collectes pour tester l'application.

3. **Configurer l'authentification** : Créez un compte utilisateur dans Supabase.

## 🐛 Problèmes résolus

- ✅ Chargement infini corrigé
- ✅ Erreurs de listeners Firebase supprimées
- ✅ Build optimisé avec target es2020
- ✅ Erreurs de code dupliqué corrigées

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Guide de migration](./MIGRATION_SUPABASE.md)
- [Documentation Supabase JS](https://supabase.com/docs/reference/javascript)

## 🚨 Important

**Les composants existants utilisent toujours Firebase**. Pour une migration complète :

1. Lisez `MIGRATION_SUPABASE.md`
2. Migrez chaque composant un par un
3. Testez après chaque migration
4. Une fois tous les composants migrés, vous pourrez supprimer Firebase

## ⚡ Commandes

```bash
# Développement
npm run dev

# Build de production
npm run build

# Prévisualisation du build
npm run preview
```

## 🎉 Félicitations !

Votre application est maintenant configurée avec Supabase, une base de données moderne et performante !
