import React, { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, LogBox, Image, Animated } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useLanguage } from '../src/contexts/LanguageContext';
import { ensureDailyOutfitReminderScheduled } from '../src/lib/notifications';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../src/lib/supabase';

// Splash screen'i manuel olarak kontrol et
// Sadece native platformlarda preventAutoHideAsync çağır
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch((error) => {
    // Hata durumunda yok say (custom splash zaten var)
    console.log('Splash screen preventAutoHide error (ignored):', error.message);
  });
}

// Reanimated shared value inline style uyarısını gizle
LogBox.ignoreLogs([
  "It looks like you might be using shared value's .value inside reanimated inline style",
]);

function CustomSplashScreen({ visible }: { visible: boolean }) {
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (!visible) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible, fadeAnim]);

  if (!shouldRender) return null;

  return (
    <Animated.View
      style={[
        styles.splashContainer,
        {
          opacity: fadeAnim,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={styles.splashContent}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/modli-logo.png')}
            style={styles.splashLogo}
            resizeMode="contain"
          />
        </View>
      </View>
    </Animated.View>
  );
}

function AppBootstrap({ onReady }: { onReady: () => void }) {
  const { user, loading } = useAuth();
  const { language } = useLanguage();

  useEffect(() => {
    // Deep link listener - OAuth callback'i yakala
    const handleDeepLink = async (event: { url: string }) => {
      console.log('🔗 Deep link received:', event.url);
      
      try {
        let url: URL;
        try {
          url = new URL(event.url);
        } catch {
          // Deep link formatı (modli://...)
          const match = event.url.match(/modli:\/\/(.*)/);
          if (match) {
            const pathAndQuery = match[1];
            // Hash varsa query string'e çevir
            const [path, hash] = pathAndQuery.split('#');
            if (hash) {
              url = new URL(`https://modli.mekanizma.com/${path}?${hash}`);
            } else {
              url = new URL(`https://modli.mekanizma.com/${pathAndQuery}`);
            }
          } else {
            console.error('❌ Invalid URL format:', event.url);
            return;
          }
        }
        
        const hash = url.hash.substring(1);
        const params = new URLSearchParams(hash || url.search);
        
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        
        // OAuth callback kontrolü
        if (accessToken && refreshToken) {
          console.log('🔐 OAuth callback detected, setting session...');
          
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (sessionError) {
            console.error('❌ Session set error:', sessionError);
          } else {
            console.log('✅ Session set successfully');
            // Profile'i yükle
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              // AuthContext'teki fetchProfile otomatik çağrılacak
              // onAuthStateChange event'i tetiklenecek
            }
          }
        } else if (type === 'recovery') {
          // Password recovery callback
          console.log('🔐 Password recovery callback detected');
        }
      } catch (error) {
        console.error('❌ Deep link parse error:', error);
      }
    };

    // İlk açılışta URL'i kontrol et
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Deep link listener'ı ekle
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Uygulama hazır olduğunda splash screen'i kapat
    if (!loading) {
      // Native splash screen'i güvenli şekilde kapat
      SplashScreen.hideAsync().catch((error) => {
        // Native splash screen hatası varsa yok say (custom splash zaten var)
        console.log('Splash screen hide error (ignored):', error.message);
      });
      // Custom splash'i de kapat
      setTimeout(() => {
        onReady();
      }, 500);
    }
  }, [loading, onReady]);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        // Giriş yapan kullanıcı için her gün 07:30'da günlük kombin bildirimi planla
        // Geliştirme ortamında (DEV) anında test bildirimi de göster
        await ensureDailyOutfitReminderScheduled(language, { debugImmediate: __DEV__ });
      } catch (error) {
        console.warn('Failed to init daily outfit notifications', error);
      }
    })();
  }, [user, language]);

  return <Slot />;
}

export default function RootLayout() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <LanguageProvider>
          <AuthProvider>
            <StatusBar style="light" />
            <View style={styles.container}>
              <AppBootstrap onReady={() => setShowCustomSplash(false)} />
            </View>
            <CustomSplashScreen visible={showCustomSplash} />
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  splashLogo: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
});
