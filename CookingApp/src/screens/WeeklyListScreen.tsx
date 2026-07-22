import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import colors from '../theme/colors';
import { getRecipes, getSelections, getShoppingList, ShoppingItem } from '../api/localStorageApi';
import { on as onEvent } from '../utils/eventEmitter';

type Props = { goBack: () => void };

export default function WeeklyListScreen({ goBack }: Props) {
  const [list, setList] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      await Promise.all([getRecipes(), getSelections()]);
      setList(await getShoppingList());
    } catch (err) {
      console.error(err);
      setMessage('Impossible de générer la liste.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const unsubRecipes = onEvent('recipes:changed', () => load());
    const unsubSelections = onEvent('selections:changed', () => load());
    return () => {
      try { unsubRecipes && unsubRecipes(); } catch { }
      try { unsubSelections && unsubSelections(); } catch { }
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Liste de la semaine</Text>
        <TouchableOpacity style={styles.ghostButton} onPress={goBack}>
          <Text style={styles.ghostText}>Retour</Text>
        </TouchableOpacity>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
      <View style={styles.spacer} />
      {loading ? <ActivityIndicator size="large" /> : null}

      {list.length === 0 && !loading ? (
        <Text style={styles.empty}>Aucun ingrédient à afficher.</Text>
      ) : (
        list.map((item, idx) => (
          <View key={`${item.name}-${idx}`} style={styles.itemRow}>
            <Text style={styles.itemText}>{item.name}</Text>
            <Text style={styles.itemQty}>{item.quantity}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.softLinen, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: colors.duskBlue },
  message: { color: '#b91c1c' },
  spacer: { height: 12 },
  ghostButton: { paddingHorizontal: 12, paddingVertical: 8 },
  ghostText: { color: colors.duskBlue, fontWeight: '700' },
  empty: { color: colors.duskBlue, opacity: 0.7 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eef2f5' },
  itemText: { color: colors.duskBlue },
  itemQty: { color: colors.duskBlue, opacity: 0.9 },
});
