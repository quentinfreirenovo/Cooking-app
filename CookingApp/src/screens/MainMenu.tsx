import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../theme/colors';

type Props = {
  navigate: (screen: 'create' | 'selectEdit' | 'weeklySelect' | 'ingredients', params?: any) => void;
};

function MenuButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuButton} activeOpacity={0.8} onPress={onPress}>
      <Text style={styles.menuButtonText}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function MainMenu({ navigate }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Cuisine</Text>
          <Text style={styles.subtitle}>Gérer vos recettes et la liste de la semaine</Text>
        </View>
      </View>

      <View style={styles.menuCard}>
        <MenuButton title="Ajouter une recette" onPress={() => navigate('create')} />
        <MenuButton title="Supprimer une recette" onPress={() => navigate('selectEdit')} />
        <MenuButton title="Sélectionner recettes - semaine" onPress={() => navigate('weeklySelect')} />
        <MenuButton title="Gérer les ingrédients" onPress={() => navigate('ingredients')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.softLinen },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: colors.duskBlue },
  subtitle: { color: colors.duskBlue, opacity: 0.85, marginTop: 6 },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  menuButton: {
    backgroundColor: colors.cornflowerBlue,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  menuButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
