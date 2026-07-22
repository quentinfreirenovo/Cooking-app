import React, { useEffect, useState } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar, useColorScheme, View, StyleSheet } from 'react-native';
import colors from './src/theme/colors';

import MainMenu from './src/screens/MainMenu';
import CreateRecipeScreen from './src/screens/CreateRecipeScreen';
import ManageRecipesScreen from './src/screens/ManageRecipesScreen';
import SelectRecipeScreen from './src/screens/SelectRecipeScreen';
import EditRecipeScreen from './src/screens/EditRecipeScreen';
import WeeklySelectScreen from './src/screens/WeeklySelectScreen';
import WeeklyListScreen from './src/screens/WeeklyListScreen';
import IngredientsScreen from './src/screens/IngredientsScreen';
import { initializeLocalData, Recipe } from './src/api/localStorageApi';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    const isJestRuntime = typeof (globalThis as { jest?: unknown }).jest !== 'undefined';
    if (isJestRuntime) return;
    initializeLocalData().catch(err => {
      console.error('Initialisation des données locales impossible', err);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppRouter />
    </SafeAreaProvider>
  );
}

type Route =
  | { name: 'menu' }
  | { name: 'create' }
  | { name: 'manage' }
  | { name: 'edit'; params: { recipe: Recipe } }
  | { name: 'weekly' }
  | { name: 'selectEdit' }
  | { name: 'weeklySelect' }
  | { name: 'ingredients' };

function AppRouter() {
  const insets = useSafeAreaInsets();
  const [route, setRoute] = useState<Route>({ name: 'menu' });

  function navigate(name: Route['name'], params?: any) {
    if (name === 'edit' && params?.recipe) {
      setRoute({ name: 'edit', params: { recipe: params.recipe } });
      return;
    }

    if (name === 'menu') setRoute({ name: 'menu' });
    if (name === 'create') setRoute({ name: 'create' });
    if (name === 'manage') setRoute({ name: 'manage' });
    if (name === 'weekly') setRoute({ name: 'weekly' });
    if (name === 'selectEdit') setRoute({ name: 'selectEdit' });
    if (name === 'weeklySelect') setRoute({ name: 'weeklySelect' });
    if (name === 'ingredients') setRoute({ name: 'ingredients' });
  }

  function goBack() {
    setRoute({ name: 'menu' });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      {route.name === 'menu' && <MainMenu navigate={navigate} />}
      {route.name === 'create' && <CreateRecipeScreen goBack={goBack} />}
      {route.name === 'manage' && <ManageRecipesScreen goBack={goBack} />}
      {route.name === 'selectEdit' && <SelectRecipeScreen goBack={goBack} />}
      {route.name === 'edit' && route.params && <EditRecipeScreen recipe={route.params.recipe} goBack={goBack} />}
      {route.name === 'weeklySelect' && <WeeklySelectScreen goBack={goBack} openWeekly={() => navigate('weekly')} />}
      {route.name === 'weekly' && <WeeklyListScreen goBack={goBack} />}
      {route.name === 'ingredients' && <IngredientsScreen goBack={goBack} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.softLinen },
});

export default App;
