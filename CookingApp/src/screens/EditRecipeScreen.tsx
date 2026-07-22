import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import colors from '../theme/colors';
import { Recipe, Ingredient, updateRecipe } from '../api/localStorageApi';

type Props = { recipe: Recipe; goBack: () => void; onSaved?: (r: Recipe) => void };

export default function EditRecipeScreen({ recipe, goBack, onSaved }: Props) {
  const [name, setName] = useState(recipe.name);
  const [ingredients, setIngredients] = useState<Ingredient[]>([...recipe.ingredients]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setName(recipe.name);
    setIngredients([...recipe.ingredients]);
  }, [recipe]);

  function updateIngredientAt(index: number, patch: Partial<Ingredient>) {
    setIngredients(prev => prev.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)));
  }

  function removeIngredient(index: number) {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  }

  async function saveCurrent() {
    if (!name.trim()) return setMessage('Nom requis');
    if (ingredients.length === 0) return setMessage('Ajoutez au moins un ingrédient');
    try {
      const updated: Recipe = { id: recipe.id, name: name.trim(), ingredients };
      const saved = await updateRecipe(updated.id, updated);
      Alert.alert('Succès', 'Recette mise à jour');
      onSaved && onSaved(saved);
      goBack();
    } catch (err) {
      console.error(err);
      setMessage('Erreur lors de la sauvegarde');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Modifier recette</Text>
      </View>

      {message ? <Text style={styles.error}>{message}</Text> : null}
      <Text style={styles.label}>Nom de la recette</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Nom..." placeholderTextColor="#999" />
      <Text style={styles.label}>Ingrédients</Text>

      {ingredients.map((ing, idx) => (
        <View key={`${ing.id || ing.name}-${idx}`} style={styles.ingredientItem}>
          <Text style={styles.ingredientName}>{ing.name}</Text>
          <View style={styles.quantityRow}>
            <TextInput
              value={String(ing.quantityValue ?? 0)}
              onChangeText={v => updateIngredientAt(idx, { quantityValue: Number(v.replace(',', '.')) || 0 })}
              keyboardType="decimal-pad"
              style={[styles.input, styles.qtyInput]}
            />
            <TextInput
              value={ing.quantityUnit || ''}
              onChangeText={v => updateIngredientAt(idx, { quantityUnit: v })}
              style={[styles.input, styles.unitInput]}
            />
            <TouchableOpacity onPress={() => removeIngredient(idx)} style={styles.removePill}>
              <Text style={styles.removeText}>Suppr.</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.saveBtn} onPress={saveCurrent}>
        <Text style={styles.saveBtnText}>Sauvegarder</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelBtn} onPress={goBack}>
        <Text style={styles.cancelBtnText}>Annuler</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.softLinen, padding: 16 },
  contentContainer: { paddingBottom: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: colors.duskBlue },
  label: { fontWeight: '700', color: colors.duskBlue, marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.babyBlueIce, borderRadius: 10, padding: 10, color: colors.duskBlue },
  error: { color: '#b91c1c', marginBottom: 8 },
  ingredientItem: { marginBottom: 10, backgroundColor: '#fff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: colors.babyBlueIce },
  ingredientName: { fontWeight: '700', color: colors.duskBlue, marginBottom: 8 },
  quantityRow: { flexDirection: 'row', alignItems: 'center' },
  qtyInput: { flex: 1, marginRight: 8 },
  unitInput: { width: 80, marginRight: 8 },
  removePill: { backgroundColor: '#ef4444', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  removeText: { color: '#fff', fontWeight: '700' },
  saveBtn: { marginTop: 10, backgroundColor: colors.cornflowerBlue, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  cancelBtn: { marginTop: 8, alignItems: 'center' },
  cancelBtnText: { color: colors.duskBlue, fontWeight: '700' },
});
