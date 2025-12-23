// ExplainerModal - Shows highlight details with external resource link
// Based on spec requirement: "Want to know more? Click <here>." linking to External Resource

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { ProductFlag } from '../utils/productFlags';

interface ExplainerModalProps {
  visible: boolean;
  onClose: () => void;
  highlight: ProductFlag & { externalResource?: string };
}

export default function ExplainerModal({ visible, onClose, highlight }: ExplainerModalProps) {
  const { colors } = useTheme();

  const handleExternalResource = async () => {
    if (highlight.externalResource) {
      try {
        const url = highlight.externalResource.startsWith('http') 
          ? highlight.externalResource 
          : `https://${highlight.externalResource}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to open this link');
        }
      } catch (error) {
        console.error('Error opening external resource:', error);
        Alert.alert('Error', 'Unable to open this link');
      }
    }
  };

  if (!visible || !highlight) return null;

  const isGreen = highlight.type === 'green';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>
        
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[
                styles.iconContainer,
                { backgroundColor: (isGreen ? '#4caf50' : '#f44336') + '20' }
              ]}>
                <Ionicons
                  name={isGreen ? 'checkmark-circle' : 'alert-circle'}
                  size={24}
                  color={isGreen ? '#4caf50' : '#f44336'}
                />
              </View>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                {highlight.title}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.surface }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
          >
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {highlight.description}
            </Text>

            {/* External Resource Link */}
            {highlight.externalResource && (
              <View style={styles.externalResourceContainer}>
                <Text style={[styles.externalResourceText, { color: colors.textSecondary }]}>
                  Want to know more?{' '}
                  <Text
                    style={[styles.linkText, { color: colors.primary }]}
                    onPress={handleExternalResource}
                  >
                    Click here
                  </Text>
                  .
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  externalResourceContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  externalResourceText: {
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});

