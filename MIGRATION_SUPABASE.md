# Migration vers Supabase

## Vue d'ensemble

L'application SmartCoop a été migrée de Firebase vers Supabase pour résoudre les problèmes de chargement infini et améliorer les performances.

## Changements principaux

### 1. Configuration de la base de données

- **Nouveau fichier** : `src/lib/supabase.ts`
  - Client Supabase configuré avec les variables d'environnement
  - Types TypeScript pour toutes les tables
  - Fonction helper pour la gestion des erreurs

### 2. Authentification

- **Nouveau service** : `src/services/auth/supabaseAuthService.ts`
  - Gestion complète de l'authentification avec Supabase Auth
  - Login, registration, logout, reset password

- **Nouveau contexte** : `src/contexts/SupabaseAuthContext.tsx`
  - Remplace `AuthContext.tsx` (Firebase)
  - Gestion d'état de l'authentification
  - Écoute des changements d'auth en temps réel

### 3. Hooks personnalisés

- **Nouveau hook** : `src/hooks/useSupabaseQuery.ts`
  - Simplifie les requêtes Supabase
  - Support des filtres et du tri
  - Support du temps réel (realtime subscriptions)
  - Gestion automatique du loading et des erreurs

## Tables Supabase disponibles

Les tables suivantes sont déjà créées dans Supabase :

- `producers` - Producteurs de cacao
- `collections` - Collectes
- `stock` - Stocks
- `warehouses` - Entrepôts
- `deliveries` - Livraisons
- `invoices` - Factures
- `users` - Utilisateurs
- `routes` - Itinéraires
- `employees` - Employés
- `organizations` - Organisations
- `budgets` - Budgets
- `finance` - Finances
- `targets` - Objectifs

## Migration des composants

### Étapes pour migrer un composant Firebase vers Supabase :

1. **Remplacer les imports Firebase** :
   ```typescript
   // Avant (Firebase)
   import { collection, onSnapshot, query } from 'firebase/firestore';
   import { db } from '../lib/firebase';

   // Après (Supabase)
   import { supabase } from '../lib/supabase';
   import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
   ```

2. **Utiliser le hook useSupabaseQuery** :
   ```typescript
   // Avant (Firebase)
   useEffect(() => {
     const q = query(collection(db, 'producers'));
     const unsubscribe = onSnapshot(q, (snapshot) => {
       const data = snapshot.docs.map(doc => ({
         id: doc.id,
         ...doc.data()
       }));
       setProducers(data);
     });
     return () => unsubscribe();
   }, []);

   // Après (Supabase)
   const { data: producers, loading, error } = useSupabaseQuery({
     table: 'producers',
     orderBy: { column: 'full_name', ascending: true },
     realtime: true
   });
   ```

3. **Mettre à jour les opérations CRUD** :
   ```typescript
   // INSERT
   const { data, error } = await supabase
     .from('producers')
     .insert({ full_name: 'John Doe', phone: '1234567890' })
     .select()
     .single();

   // UPDATE
   const { error } = await supabase
     .from('producers')
     .update({ status: 'inactive' })
     .eq('id', producerId);

   // DELETE
   const { error } = await supabase
     .from('producers')
     .delete()
     .eq('id', producerId);

   // SELECT
   const { data, error } = await supabase
     .from('producers')
     .select('*')
     .eq('status', 'active')
     .order('full_name', { ascending: true });
   ```

## Avantages de Supabase

1. **Performance** : Queries optimisées et indexes
2. **Temps réel** : Subscriptions en temps réel sans boucles infinies
3. **Types TypeScript** : Support natif des types
4. **Sécurité** : Row Level Security (RLS) intégré
5. **Simplicité** : API plus simple et intuitive

## Prochaines étapes

Les composants suivants doivent encore être migrés :

- [ ] `ProducerList.tsx`
- [ ] `CollectionList.tsx`
- [ ] `StockList.tsx`
- [ ] `DeliveryList.tsx`
- [ ] `InvoiceList.tsx`
- [ ] `RouteList.tsx`
- [ ] Dashboard et ses sous-composants
- [ ] Tous les formulaires et modals

## Dépannage

### Erreur : "Session expirée"
Solution : L'utilisateur doit se reconnecter

### Erreur : "Aucune donnée trouvée"
Solution : Vérifier que les données existent dans Supabase

### Problèmes de connexion
Solution : Vérifier les variables d'environnement dans `.env`

## Support

Pour toute question sur la migration, consultez :
- [Documentation Supabase](https://supabase.com/docs)
- [Guide de migration Firebase → Supabase](https://supabase.com/docs/guides/migrations/firebase)
