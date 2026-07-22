import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import colors from '../theme/colors';
import { Recipe, getRecipes, getSelections, updateSelections } from '../api/localStorageApi';
import { on as onEvent } from '../utils/eventEmitter';

type Props = { goBack: () => void; openWeekly: () => void };

export default function WeeklySelectScreen({ goBack, openWeekly }: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    load();
    const unsub = onEvent('recipes:changed', () => load());
    return () => { try { unsub && unsub(); } catch { } };
  }, []);

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const [r, s] = await Promise.all([getRecipes(), getSelections()]);
      setRecipes(r);
      setSelectedIds(s || []);
    } catch (err) {
      console.error(err);
      setMessage("Impossible de charger les recettes.");
    } finally {
      setLoading(false);
    }
  }

  async function toggle(id: string) {
    if (savingIds.includes(id)) return;
    const wasSelected = selectedIds.includes(id);
    const next = wasSelected ? selectedIds.filter(x => x !== id) : [...selectedIds, id];
    setSavingIds(prev => [...prev, id]);
    try {
      const updated = await updateSelections(next);
      setSelectedIds(Array.isArray(updated) ? updated : next);
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', "Impossible de mettre à jour la sélection.");
    } finally {
      setSavingIds(prev => prev.filter(x => x !== id));
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Sélection recettes - semaine</Text>
        <TouchableOpacity style={styles.ghostButton} onPress={goBack}>
          <Text style={styles.ghostText}>Retour</Text>
        </TouchableOpacity>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
      <View style={styles.spacer} />
      {loading ? <ActivityIndicator size="large" /> : null}

      {recipes.length === 0 && !loading ? (
        <Text style={styles.empty}>Aucune recette disponible.</Text>
      ) : (
        recipes.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={styles.rowHeader}>
              <Text style={[styles.name, styles.recipeName]}>{r.name || 'Sans nom'}</Text>
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  selectedIds.includes(r.id) ? styles.selectActive : null,
                  savingIds.includes(r.id) ? styles.selectDisabled : null,
                ]}
                onPress={() => toggle(r.id)}
                disabled={savingIds.includes(r.id)}
              >
                <Text style={[styles.selectText, selectedIds.includes(r.id) ? styles.selectTextActive : null]}>
                  {savingIds.includes(r.id) ? '...' : selectedIds.includes(r.id) ? 'Incluse' : 'Inclure'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.goButton} onPress={openWeekly} activeOpacity={0.85}>
        <Text style={styles.goButtonText}>Voir la liste de la semaine</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.softLinen, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: colors.duskBlue },
  message: { color: '#b91c1c' },
  spacer: { height: 12 },
  ghostButton: { paddingHorizontal: 12, paddingVertical: 8 },
  ghostText: { color: colors.duskBlue, fontWeight: '700' },
  empty: { color: colors.duskBlue, opacity: 0.7 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.babyBlueIce,
  },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: colors.duskBlue },
  recipeName: { color: '#304c89', fontSize: 16, fontWeight: 'bold' },
  selectButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.babyBlueIce },
  selectActive: { backgroundColor: colors.cornflowerBlue },
  selectDisabled: { opacity: 0.6 },
  selectText: { color: colors.duskBlue, fontWeight: '700' },
  selectTextActive: { color: '#fff' },
  goButton: { marginTop: 10, backgroundColor: colors.cornflowerBlue, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  goButtonText: { color: '#fff', fontWeight: '700' },
});
