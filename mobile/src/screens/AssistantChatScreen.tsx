import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useNavigationStore } from '../store/navigationStore';
import { apiService } from '../services/apiService';
import { voiceService, SupportedLanguage } from '../services/voiceService';
import { RouteResult } from '../services/localRouter';
import { Colors, Shadows, Radii, Spacing, Typography } from '../theme/tokens';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  route?: RouteResult | null;
  facility?: any;
  timestamp: string;
}

interface AssistantChatScreenProps {
  onBack: () => void;
  onStartRoute: (route: RouteResult) => void;
}

export const AssistantChatScreen: React.FC<AssistantChatScreenProps> = ({
  onBack,
  onStartRoute
}) => {
  const { startNode, selectedProfile, language, setLanguage, voiceEnabled } = useNavigationStore();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const flatListRef = React.useRef<FlatList<any>>(null);

  const getWelcomeText = (lang: SupportedLanguage) => {
    switch (lang) {
      case 'kn':
        return 'ನಮಸ್ಕಾರ! ನಾನು ಕೆಎಸ್ಆರ್ ಬೆಂಗಳೂರು ನಿಲ್ದಾಣದ ಅಧಿಕೃತ ಎಐ ಸಹಾಯಕ ಟರ್ನ್ ವೈಸ್ (Turn Wise). ಪ್ಲಾಟ್‌ಫಾರ್ಮ್, ಕೋಚ್ ಅಥವಾ ಸುಲಭ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ಕೇಳಿ.';
      case 'hi':
        return 'नमस्कार! मैं केएसआर बेंगलुरु स्टेशन का आधिकारिक एआई सहायक टर्न वाइज (Turn Wise) हूँ। प्लेटफॉर्म, कोच या सुगम मार्ग के लिए मुझसे पूछें।';
      case 'en':
      default:
        return 'Namaskara! I am Turn Wise AI Assistant, your official guide for KSR Bengaluru Railway Station. Ask me for platforms, coach positions, lifts, or accessible routes.';
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm_welcome',
      sender: 'assistant',
      text: getWelcomeText(language),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  useEffect(() => {
    // When language changes, update voiceService language
    voiceService.setLanguage(language);
  }, [language]);

  useEffect(() => {
    const t = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
    return () => clearTimeout(t);
  }, [messages, loading]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText.trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputText('');
    setLoading(true);

    try {
      const resp = await apiService.queryAssistant(textToSend, {
        currentNodeId: startNode?.id,
        profileId: selectedProfile,
        language
      });

      const assistantMsg: Message = {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: resp.reply,
        route: resp.route || null,
        facility: resp.facility || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Speak aloud in passenger's chosen language if voice is enabled
      if (voiceEnabled) {
        voiceService.speak(resp.reply, { language });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_err_${Date.now()}`,
          sender: 'assistant',
          text: language === 'kn'
            ? 'ಆಫ್‌ಲೈನ್ ಮೋಡ್ ಸಕ್ರಿಯವಾಗಿದೆ. ನೀವು ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ 1 ರಿಂದ 10 ರವರೆಗೆ ಸಂಚರಿಸಬಹುದು.'
            : (language === 'hi'
              ? 'ऑफ़लाइन मोड सक्रिय है। आप प्लेटफॉर्म 1 से 10 तक नेविगेट कर सकते हैं।'
              : 'I am currently operating in offline mode. Local routing for Platforms 1 to 10 is available.'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      voiceService.stopListening();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      const started = voiceService.startListening(
        (transcript) => {
          setIsRecording(false);
          setInputText(transcript);
          handleSend(transcript);
        },
        (error) => {
          setIsRecording(false);
          console.warn('Voice error:', error);
        },
        language
      );
      if (!started) {
        setIsRecording(false);
      }
    }
  };

  const getQuickPrompts = () => {
    switch (language) {
      case 'kn':
        return [
          'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ 1 ರಲ್ಲಿ ಕೋಚ್ ಬಿ4 ಎಲ್ಲಿದೆ?',
          'ಮೆಟ್ಟಿಲುಗಳಿಲ್ಲದೆ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ 8 ಗೆ ದಾರಿ',
          'ಕರ್ನಾಟಕ ಎಕ್ಸ್‌ಪ್ರೆಸ್ ಯಾವ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್?',
          'ಹತ್ತಿರದ ಶೌಚಾಲಯ ಎಲ್ಲಿದೆ?',
          'ಹತ್ತಿರದ ಲಿಫ್ಟ್ ಎಲ್ಲಿದೆ?',
          'ಟಿಕೆಟ್ ಕೌಂಟರ್ ಎಲ್ಲಿದೆ?',
          'ನಮ್ಮ ಮೆಟ್ರೋಗೆ ದಾರಿ',
          'ನಾನು ದಾರಿ ತಪ್ಪಿದ್ದೇನೆ, ಸಹಾಯ ಮಾಡಿ'
        ];
      case 'hi':
        return [
          'प्लेटफॉर्म 1 पर कोच बी4 कहाँ है?',
          'बिना सीढ़ियों के प्लेटफॉर्म 8 कैसे जाएँ?',
          'कर्नाटक एक्सप्रेस किस प्लेटफॉर्म पर है?',
          'निकटतम शौचालय कहाँ है?',
          'निकटतम लिफ्ट कहाँ है?',
          'टिकट काउंटर कहाँ है?',
          'नम्मा मेट्रो का रास्ता',
          'मैं खो गया हूँ, मदद करो'
        ];
      case 'en':
      default:
        return [
          'Where is coach B4 on train 12658?',
          'Take me to Platform 8 without stairs',
          'Where is Karnataka Express?',
          'Find nearest accessible toilet',
          'Where is the nearest lift?',
          'Take me to ticket counter',
          'How to reach Namma Metro?',
          "I'm lost - rescue me"
        ];
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>TURN WISE AI ASSISTANT</Text>
            <Text style={styles.headerSub}>Multilingual Grounded Spatial Guide</Text>
          </View>

          {/* Language Selector Pills */}
          <View style={styles.langPillsRow}>
            {(['en', 'kn', 'hi'] as SupportedLanguage[]).map((l) => {
              const isSel = language === l;
              return (
                <TouchableOpacity
                  key={l}
                  style={[styles.langPill, isSel && styles.langPillActive]}
                  onPress={() => setLanguage(l)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.langPillText, isSel && styles.langPillTextActive]}>
                    {l === 'en' ? 'EN' : (l === 'kn' ? 'ಕನ್ನಡ' : 'हिंदी')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick Prompts Bar */}
        <View style={styles.promptsContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={getQuickPrompts()}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.promptsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.promptPill}
                onPress={() => handleSend(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.promptPillText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Chat Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isUser = item.sender === 'user';
            return (
              <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
                {!isUser && (
                  <View style={styles.assistantAvatar}>
                    <Text style={{ fontSize: 16 }}>🚆</Text>
                  </View>
                )}

                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
                  <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
                    {item.text}
                  </Text>

                  {/* Route Card Attachment */}
                  {item.route && (
                    <View style={styles.routeCard}>
                      <View style={styles.routeHeader}>
                        <Text style={styles.routeTitle}>
                          {item.route.coachInfo
                            ? `Coach ${item.route.coachInfo.coachNumber} • Platform ${item.route.coachInfo.platformNumber}`
                            : `Route to ${item.route.destination.name}`}
                        </Text>
                        <Text style={styles.routeDist}>
                          {item.route.totalDistanceMeters}m • ~{item.route.estimatedTimeMinutes} min
                        </Text>
                      </View>

                      {item.route.accessibility.stepFree && (
                        <View style={styles.stepFreeBadge}>
                          <Text style={styles.stepFreeText}>♿ 100% Step-free route</Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.startNavBtn}
                        onPress={() => onStartRoute(item.route!)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.startNavBtnText}>▶ START NAVIGATION</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <Text style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampAssistant]}>
                    {item.timestamp}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Listening Bar */}
        {isRecording && (
          <View style={styles.listeningBanner}>
            <Text style={styles.listeningText}>
              🔴 {language === 'kn' ? 'ಆಲಿಸಲಾಗುತ್ತಿದೆ... ಈಗ ಮಾತನಾಡಿ' : (language === 'hi' ? 'सुन रहा हूँ... अब बोलें' : 'Listening... Speak now')}
            </Text>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              language === 'kn'
                ? 'ಕನ್ನಡದಲ್ಲಿ ಪ್ರಶ್ನೆ ಕೇಳಿ (ಉದಾ: ಕೋಚ್ ಬಿ4 ಎಲ್ಲಿದೆ?)...'
                : (language === 'hi'
                  ? 'हिंदी में पूछें (उदा: कोच बी4 कहाँ है?)...'
                  : 'Ask in English, Kannada, or Hindi...')
            }
            placeholderTextColor="#94A3B8"
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />

          {/* Multilingual Microphone Button */}
          <TouchableOpacity
            style={[styles.micBtn, isRecording && styles.micBtnActive]}
            onPress={handleMicPress}
            activeOpacity={0.8}
          >
            <Text style={styles.micBtnText}>{isRecording ? '⏹' : '🎤'}</Text>
          </TouchableOpacity>

          {/* Send Button */}
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendBtnText}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9'
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155'
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B'
  },
  langPillsRow: {
    flexDirection: 'row',
    gap: 4
  },
  langPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  langPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8'
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  langPillTextActive: {
    color: '#FFFFFF'
  },
  promptsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  promptsList: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8
  },
  promptPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  promptPillText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '600'
  },
  messageList: {
    padding: 16,
    gap: 12
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8
  },
  messageRowUser: {
    justifyContent: 'flex-end'
  },
  messageRowAssistant: {
    justifyContent: 'flex-start'
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    padding: 14
  },
  bubbleUser: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4
  },
  bubbleAssistant: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20
  },
  bubbleTextUser: {
    color: '#FFFFFF'
  },
  bubbleTextAssistant: {
    color: '#1E293B'
  },
  timestamp: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end'
  },
  timestampUser: {
    color: 'rgba(255, 255, 255, 0.7)'
  },
  timestampAssistant: {
    color: '#94A3B8'
  },
  routeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  routeHeader: {
    marginBottom: 6
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  routeDist: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  stepFreeBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10
  },
  stepFreeText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700'
  },
  startNavBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  startNavBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12
  },
  listeningBanner: {
    backgroundColor: '#FEF2F2',
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
    paddingVertical: 6,
    alignItems: 'center'
  },
  listeningText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700'
  },
  inputBar: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B'
  },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  micBtnActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444'
  },
  micBtnText: {
    fontSize: 18
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1'
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
