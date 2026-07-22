import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import colors from '../theme/colors';
import { getIngredients, createIngredient, updateIngredient, deleteIngredient, CanonicalIngredient } from '../api/localStorageApi';
import { on as onEvent } from '../utils/eventEmitter';

type Props = { goBack?: () => void };

export default function IngredientsScreen({ goBack }: Props) {
  const [ingredients, setIngredients] = useState<CanonicalIngredient[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<CanonicalIngredient | null>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    try {
      setIngredients(await getIngredients());
    } catch (err) {
      console.error(err);
      setMessage("Impossible de charger la liste des ingrédients.");
    }
  }

  useEffect(() => {
    load();
    const unsub = onEvent('ingredients:changed', () => load());
    return () => { try { unsub && unsub(); } catch { } };
  }, []);

  function openNew() { setEditing(null); setName(''); setModalVisible(true); }
  function openEdit(i: CanonicalIngredient) { setEditing(i); setName(i.name); setModalVisible(true); }

  async function save() {
    try {
      if (!name.trim()) return;
      if (editing) await updateIngredient(editing.id, { name: name.trim() });
      else await createIngredient({ name: name.trim() });
      setModalVisible(false);
      await load();
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de sauvegarder');
    }
  }

  function remove(id: string) {
    Alert.alert('Supprimer', 'Voulez-vous supprimer cet ingrédient ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteIngredient(id);
            await load();
          } catch (err) {
            console.error(err);
            Alert.alert('Erreur', "Impossible de supprimer l'ingrédient");
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Ingrédients</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={openNew}>
          <Text style={styles.primaryButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <FlatList
        data={ingredients}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemText}>{item.name}</Text>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.ghostButton}><Text style={styles.ghostText}>Modifier</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => remove(item.id)} style={styles.ghostButton}><Text style={styles.deleteText}>Supprimer</Text></TouchableOpacity>
            </View>
          </View>
        )}
      />

      {goBack ? (
        <TouchableOpacity onPress={goBack} style={styles.bottomBackButton}>
          <Text style={styles.ghostText}>Retour</Text>
        </TouchableOpacity>
      ) : null}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{editing ? 'Modifier' : 'Nouvel ingrédient'}</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Nom de l'ingrédient" style={styles.input} />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={save}><Text style={styles.primaryButtonText}>Enregistrer</Text></TouchableOpacity>
            <View style={styles.modalSpacer} />
            <TouchableOpacity style={styles.ghostButton} onPress={() => setModalVisible(false)}><Text style={styles.ghostText}>Annuler</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.softLinen },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: colors.duskBlue },
  primaryButton: { backgroundColor: colors.cornflowerBlue, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  ghostButton: { paddingHorizontal: 8, paddingVertical: 6 },
  ghostText: { color: colors.duskBlue, fontWeight: '700' },
  deleteText: { color: '#b91c1c', fontWeight: '700' },
  message: { color: '#b91c1c', marginBottom: 8 },
  itemRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eef2f5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemText: { color: colors.duskBlue },
  itemActions: { flexDirection: 'row' },
  modalContainer: { flex: 1, padding: 20, backgroundColor: colors.softLinen },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e6e9ec' },
  modalActions: { flexDirection: 'row', marginTop: 12 },
  modalSpacer: { width: 12 },
  bottomBackButton: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.babyBlueIce, borderRadius: 8, alignItems: 'center', marginTop: 12 },
});
