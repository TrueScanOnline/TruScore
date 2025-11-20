import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureException } from '../services/errorReporting';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Report to error tracking service if available
    try {
      captureException(error, {
        react: {
          componentStack: errorInfo.componentStack,
        },
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Theme colors
  const colors = {
    background: isDark ? '#121212' : '#fff',
    text: isDark ? '#fff' : '#000',
    textSecondary: isDark ? '#999' : '#666',
    textTertiary: isDark ? '#666' : '#999',
    error: '#ff6b6b',
    primary: '#16a085',
    surface: isDark ? '#1e1e1e' : '#f5f5f5',
    border: isDark ? '#333' : '#e0e0e0',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Oops! Something went wrong
        </Text>

        <Text style={[styles.message, { color: colors.textSecondary }]}>
          We're sorry, but something unexpected happened. The app is still safe to use.
        </Text>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.errorTitle, { color: colors.error }]}>
              Error Details:
            </Text>
            <Text style={[styles.errorMessage, { color: colors.text }]}>
              {error.message || 'Unknown error occurred'}
            </Text>
            {__DEV__ && error.stack && (
              <ScrollView style={styles.stackTrace}>
                <Text style={[styles.stackTraceText, { color: colors.textTertiary }]}>
                  {error.stack}
                </Text>
              </ScrollView>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: colors.primary }]}
          onPress={onReset}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.resetButtonText}>Try Again</Text>
        </TouchableOpacity>

        <Text style={[styles.helpText, { color: colors.textTertiary }]}>
          If this problem persists, please restart the app or contact support.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorContainer: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    marginBottom: 12,
  },
  stackTrace: {
    maxHeight: 200,
    marginTop: 8,
  },
  stackTraceText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    marginBottom: 16,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ErrorBoundary;

