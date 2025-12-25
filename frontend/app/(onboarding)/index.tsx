import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../src/contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Model images - placeholder URLs, replace with actual images
const modelImages = [
  {
    id: '1',
    uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    name: 'Model 1',
  },
  {
    id: '2',
    uri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    name: 'Model 2',
  },
  {
    id: '3',
    uri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    name: 'Model 3',
  },
  {
    id: '4',
    uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    name: 'Model 4',
  },
];

// Clothing items - placeholder URLs, replace with actual images
const clothingItems = [
  {
    id: '1',
    uri: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop',
    name: 'Clothing 1',
  },
  {
    id: '2',
    uri: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop',
    name: 'Clothing 2',
  },
  {
    id: '3',
    uri: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop',
    name: 'Clothing 3',
  },
  {
    id: '4',
    uri: 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=400&h=400&fit=crop',
    name: 'Clothing 4',
  },
];

// Try-on results mapping (model + clothing combination)
const tryOnResults: Record<string, Record<string, string>> = {
  '1': {
    '1': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    '2': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    '3': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    '4': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
  },
  '2': {
    '1': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    '2': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    '3': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    '4': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
  },
  '3': {
    '1': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    '2': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    '3': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    '4': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
  },
  '4': {
    '1': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    '2': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    '3': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    '4': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
  },
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedClothing, setSelectedClothing] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = async () => {
    if (currentIndex === 0 && !selectedModel) {
      // First page - must select a model
      return;
    }
    if (currentIndex === 1 && !selectedClothing) {
      // Second page - must select clothing
      return;
    }
    if (currentIndex < 2) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)');
  };

  const renderModelSelection = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.mainTitle}>{t.onboarding.slide1Title}</Text>
      <Text style={styles.subTitle}>{t.onboarding.slide1Desc}</Text>

      <View style={styles.gridContainer}>
        {modelImages.map((model) => (
          <TouchableOpacity
            key={model.id}
            style={[
              styles.gridItem,
              selectedModel === model.id && styles.gridItemSelected,
            ]}
            onPress={() => setSelectedModel(model.id)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: model.uri }} style={styles.gridImage} />
            {selectedModel === model.id && (
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark-circle" size={28} color="#22c55e" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderClothingSelection = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.mainTitle}>{t.onboarding.slide2Title}</Text>
      <Text style={styles.subTitle}>{t.onboarding.slide2Desc}</Text>

      <View style={styles.gridContainer}>
        {clothingItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.gridItem,
              selectedClothing === item.id && styles.gridItemSelected,
            ]}
            onPress={() => setSelectedClothing(item.id)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: item.uri }} style={styles.gridImage} />
            {selectedClothing === item.id && (
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark-circle" size={28} color="#22c55e" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderTryOnResult = () => {
    const resultUri =
      selectedModel && selectedClothing
        ? tryOnResults[selectedModel]?.[selectedClothing] ||
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop'
        : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop';

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>{t.onboarding.slide3Title}</Text>

        <View style={styles.resultImageContainer}>
          <Image source={{ uri: resultUri }} style={styles.resultImage} />
        </View>
      </ScrollView>
    );
  };

  const renderSlide = ({ item, index }: { item: { id: string }; index: number }) => (
    <View style={[styles.slide, { width }]}>
      {index === 0 && renderModelSelection()}
      {index === 1 && renderClothingSelection()}
      {index === 2 && renderTryOnResult()}
    </View>
  );

  const renderDot = (index: number) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const dotWidth = scrollX.interpolate({
      inputRange,
      outputRange: [8, 24, 8],
      extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        key={index}
        style={[styles.dot, { width: dotWidth, opacity }]}
      />
    );
  };

  const getButtonText = () => {
    if (currentIndex === 0) return t.onboarding.next;
    if (currentIndex === 1) return t.onboarding.tryOn;
    return t.onboarding.getStarted;
  };

  const slides = [{ id: '1' }, { id: '2' }, { id: '3' }];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Language Toggle */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.langButton}
          onPress={() => setLanguage(language === 'en' ? 'tr' : 'en')}
        >
          <Text style={styles.langText}>{language === 'en' ? 'TR' : 'EN'}</Text>
        </TouchableOpacity>
        {currentIndex < 2 && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>{t.onboarding.skip}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
      />

      {/* Pagination */}
      <View style={styles.pagination}>
        {slides.map((_, index) => renderDot(index))}
      </View>

      {/* Button */}
      <TouchableOpacity
        style={[
          styles.button,
          ((currentIndex === 0 && !selectedModel) ||
            (currentIndex === 1 && !selectedClothing)) &&
            styles.buttonDisabled,
        ]}
        onPress={handleNext}
        activeOpacity={0.8}
        disabled={
          (currentIndex === 0 && !selectedModel) ||
          (currentIndex === 1 && !selectedClothing)
        }
      >
        <Text style={styles.buttonText}>{getButtonText()}</Text>
      </TouchableOpacity>

      <View style={{ height: insets.bottom + 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  langButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  langText: {
    color: '#1f2937',
    fontWeight: '600',
    fontSize: 14,
  },
  skipText: {
    color: '#6B46C1',
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  gridItem: {
    width: (width - 48) / 2 - 8,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gridItemSelected: {
    borderColor: '#22c55e',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultImageContainer: {
    width: width - 40,
    aspectRatio: 2 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
    backgroundColor: '#f9fafb',
  },
  resultImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B46C1',
    marginHorizontal: 4,
  },
  button: {
    backgroundColor: '#6B46C1',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
