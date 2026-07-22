import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, Alert } from 'react-native';
import colors from '../theme/colors';
import { Ingredient, Recipe, createRecipe, getIngredients, CanonicalIngredient } from '../api/localStorageApi';
import { on as onEvent } from '../utils/eventEmitter';

function uniqueId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type Props = { goBack: () => void; onCreated?: (recipe: Recipe) => void };

export default function CreateRecipeScreen({ goBack, onCreated }: Props) {
  const [newRecipeName, setNewRecipeName] = useState('');
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('g');
  const units = ['g', 'mg', 'ml', 'l', 'portion'];
  const [currentIngredients, setCurrentIngredients] = useState<Ingredient[]>([]);
  const [message, setMessage] = useState('');
  const [allIngredients, setAllIngredients] = useState<CanonicalIngredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  function cycleUnit() {
    const idx = units.indexOf(ingredientUnit);
    setIngredientUnit(units[(idx + 1) % units.length]);
  }

  useEffect(() => {
    (async () => {
      try {
        setAllIngredients(await getIngredients());
      } catch (err) {
        console.error(err);
      }
    })();
    const unsub = onEvent('ingredients:changed', async () => {
      try {
        setAllIngredients(await getIngredients());
      } catch (err) {
        console.error(err);
      }
    });
    return () => { try { unsub && unsub(); } catch { } };
  }, []);

  async function openPicker() {
    setPickerVisible(true);
    setPickerSearch('');
    try {
      setAllIngredients(await getIngredients());
    } catch (err) {
      console.error(err);
    }
  }

  function addIngredient() {
    if (!selectedIngredientId) {
      Alert.alert('Sélection requise', 'Veuillez choisir un ingrédient depuis la liste déroulante.');
      return;
    }
    if (!ingredientQuantity.trim()) {
      setMessage("Remplissez la quantité de l'ingrédient.");
      return;
    }
    const qtyValue = parseFloat(ingredientQuantity.trim()) || 0;
    const found = allIngredients.find(a => a.id === selectedIngredientId);
    setCurrentIngredients(prev => [
      ...prev,
      { id: selectedIngredientId || uniqueId(), name: found?.name || ingredientName.trim(), quantityValue: qtyValue, quantityUnit: ingredientUnit },
    ]);
    setIngredientName('');
    setIngredientQuantity('');
    setIngredientUnit('g');
    setSelectedIngredientId(null);
    setMessage('');
  }

  function removeIngredient(id: string) {
    setCurrentIngredients(prev => prev.filter(i => i.id !== id));
  }

  async function save() {
    if (!newRecipeName.trim()) return setMessage('Nom requis.');
    if (currentIngredients.length === 0) return setMessage('Ajoutez au moins un ingrédient.');
    try {
      const created = await createRecipe({ id: '', name: newRecipeName.trim(), ingredients: currentIngredients });
      Alert.alert('Succès', 'Recette créée');
      onCreated && onCreated(created);
      goBack();
    } catch (err) {
      console.error(err);
      setMessage("Impossible d'enregistrer la recette.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer une recette</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <TextInput placeholder="Nom de la recette" value={newRecipeName} onChangeText={setNewRecipeName} style={styles.input} />

      <View style={styles.row}>
        <View style={styles.ingredientSelectWrapper}>
          <TouchableOpacity onPress={openPicker} style={[styles.input, styles.flex]}>
            <Text style={selectedIngredientId ? styles.selectedIngredientText : styles.placeholderIngredientText}>
              {selectedIngredientId ? ingredientName || 'Ingrédient sélectionné' : 'Choisir un ingrédient'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.quantityWrapper}>
          <TextInput placeholder="Quantité" value={ingredientQuantity} onChangeText={setIngredientQuantity} style={[styles.input, styles.quantity]} />
          <TouchableOpacity style={styles.unitButton} onPress={cycleUnit}>
            <Text style={styles.unitText}>{ingredientUnit}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={addIngredient}>
        <Text style={styles.primaryButtonText}>Ajouter l'ingrédient</Text>
      </TouchableOpacity>

      {currentIngredients.map(i => (
        <View key={i.id} style={styles.ingredientRow}>
          <Text style={styles.ingredientText}>{i.name} - {i.quantityValue} {i.quantityUnit}</Text>
          <TouchableOpacity onPress={() => removeIngredient(i.id)}>
            <Text style={styles.remove}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.primaryButton} onPress={save}>
        <Text style={styles.primaryButtonText}>Enregistrer la recette</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ghostButton} onPress={goBack}>
        <Text style={styles.ghostText}>Retour</Text>
      </TouchableOpacity>

      <Modal visible={pickerVisible} animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalBody}>
          <TextInput placeholder="Rechercher un ingrédient" value={pickerSearch} onChangeText={setPickerSearch} style={styles.searchInput} />
          <View style={styles.pickerListBox}>
            <FlatList
              data={allIngredients.filter(a => a.name.toLowerCase().includes(pickerSearch.trim().toLowerCase()))}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.pickerItem} onPress={() => { setIngredientName(item.name); setSelectedIngredientId(item.id); setPickerVisible(false); }}>
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
          <TouchableOpacity style={styles.closePickerButton} onPress={() => setPickerVisible(false)}>
            <Text style={styles.primaryButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.softLinen },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: colors.duskBlue },
  input: { borderWidth: 1, borderColor: colors.babyBlueIce, borderRadius: 10, padding: 12, marginBottom: 8, backgroundColor: '#fff', color: colors.duskBlue },
  row: { flexDirection: 'row', alignItems: 'center' },
  ingredientSelectWrapper: { flex: 1 },
  selectedIngredientText: { color: '#000' },
  placeholderIngredientText: { color: '#9ca3af' },
  quantityWrapper: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1, marginRight: 8, justifyContent: 'center' },
  quantity: { width: 110 },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, alignItems: 'center' },
  ingredientText: { color: colors.duskBlue },
  remove: { color: '#dc2626', fontWeight: '700' },
  message: { marginBottom: 8, color: '#b91c1c' },
  unitButton: { marginLeft: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.babyBlueIce, borderRadius: 8 },
  unitText: { color: colors.duskBlue, fontWeight: '700' },
  primaryButton: { backgroundColor: colors.cornflowerBlue, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  ghostButton: { marginTop: 12, alignItems: 'center' },
  ghostText: { color: colors.duskBlue, fontWeight: '700' },
  modalBody: { flex: 1, padding: 12, backgroundColor: '#fff' },
  searchInput: { borderWidth: 1, borderColor: colors.babyBlueIce, borderRadius: 10, padding: 12, marginBottom: 8, backgroundColor: '#fff', color: '#000' },
  pickerListBox: { height: 220, borderWidth: 1, borderColor: '#e6e9ec', borderRadius: 8, overflow: 'hidden' },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  pickerItemText: { color: '#000' },
  closePickerButton: { backgroundColor: colors.cornflowerBlue, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
});
