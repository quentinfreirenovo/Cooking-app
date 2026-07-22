import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import colors from '../theme/colors';
import { Recipe, getRecipes, deleteRecipe } from '../api/localStorageApi';
import { on as onEvent } from '../utils/eventEmitter';

type Props = { goBack: () => void };

export default function SelectRecipeScreen({ goBack }: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    load();
    const unsub = onEvent('recipes:changed', () => load());
    return () => { try { unsub && unsub(); } catch { } };
  }, []);

  async function load() {
    setMessage('');
    try {
      setRecipes(await getRecipes());
    } catch (err) {
      console.error(err);
      setMessage("Impossible de charger les recettes.");
    }
  }

  function remove(id: string) {
    Alert.alert('Supprimer', 'Confirmer la suppression ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecipe(id);
            await load();
            Alert.alert('Succès', 'Recette supprimée');
          } catch (err) {
            console.error(err);
            Alert.alert('Erreur', 'Impossible de supprimer');
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Supprimer une recette</Text>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {recipes.length === 0 ? (
        <Text style={styles.empty}>Aucune recette disponible.</Text>
      ) : (
        recipes.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={styles.rowHeader}>
              <Text style={styles.name}>{r.name}</Text>
              <TouchableOpacity style={[styles.smallButton, styles.dangerButton]} onPress={() => remove(r.id)}>
                <Text style={styles.dangerButtonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.softLinen },
  contentContainer: { paddingBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  backButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.babyBlueIce, borderRadius: 8 },
  backButtonText: { color: colors.duskBlue, fontWeight: '700' },
  message: { color: '#b91c1c', paddingHorizontal: 16 },
  empty: { paddingHorizontal: 16, color: colors.duskBlue, opacity: 0.7 },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.babyBlueIce,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 3,
  },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '700', fontSize: 16, color: colors.duskBlue },
  smallButton: { marginLeft: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.babyBlueIce, borderRadius: 8 },
  smallButtonText: { color: colors.duskBlue, fontWeight: '700' },
  dangerButton: { backgroundColor: '#ef4444' },
  dangerButtonText: { color: '#fff', fontWeight: '700' },
});
