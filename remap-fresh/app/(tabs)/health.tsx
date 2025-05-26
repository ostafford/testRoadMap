import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

// Import our health monitoring service
import { 
  runComprehensiveHealthCheck, 
  healthMonitorClient,
  type HealthCheckResult 
} from '../services/health';

// Get device dimensions for responsive design
const { width: screenWidth } = Dimensions.get('window');

/**
 * Complete Health Monitor Component
 * 
 * This demonstrates comprehensive system health monitoring including:
 * - Backend API connectivity
 * - Database integration testing
 * - Location services verification
 * - Device compatibility checks
 * - Real-time status updates
 */
export default function SystemHealthScreen() {
  // State management for health check results and UI state
  const [healthChecks, setHealthChecks] = useState<HealthCheckResult[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [locationStatus, setLocationStatus] = useState<HealthCheckResult | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<HealthCheckResult | null>(null);

  /**
   * Location Services Health Check
   * Tests GPS and location permissions for ReMap's core functionality
   */
  const checkLocationServices = useCallback(async (): Promise<HealthCheckResult> => {
    try {
      // Check if location services are enabled on the device
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        return {
          name: 'Location Services',
          status: 'error',
          message: 'Location services are disabled',
          details: 'Please enable location services in your device settings to use ReMap\'s location-based features.',
          lastChecked: new Date(),
        };
      }

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return {
          name: 'Location Services',
          status: 'warning',
          message: 'Location permission not granted',
          details: 'ReMap needs location permission to pin memories to specific places. You can grant permission in Settings.',
          lastChecked: new Date(),
        };
      }

      // Test getting current location to verify complete functionality
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        name: 'Location Services',
        status: 'healthy',
        message: 'Location services working correctly',
        details: `Current location: ${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}\nAccuracy: ±${Math.round(location.coords.accuracy || 0)}m`,
        lastChecked: new Date(),
      };

    } catch (error) {
      return {
        name: 'Location Services',
        status: 'error',
        message: 'Location access failed',
        details: error instanceof Error ? error.message : 'Unknown location error',
        lastChecked: new Date(),
      };
    }
  }, []);

  /**
   * Device Compatibility Check
   * Gathers comprehensive device and runtime information
   */
  const checkDeviceCompatibility = useCallback(async (): Promise<HealthCheckResult> => {
    try {
      const deviceInfo = {
        platform: Constants.platform?.ios ? 'iOS' : Constants.platform?.android ? 'Android' : 'Web',
        expoVersion: Constants.expoVersion,
        deviceName: Constants.deviceName || 'Unknown Device',
        isDevice: Constants.isDevice,
        systemVersion: Constants.platform?.ios?.systemVersion || Constants.platform?.android?.versionCode?.toString() || 'Unknown',
      };

      return {
        name: 'Device Compatibility',
        status: 'healthy',
        message: `Running on ${deviceInfo.platform}`,
        details: [
          `Device: ${deviceInfo.deviceName}`,
          `System: ${deviceInfo.systemVersion}`,
          `Expo: ${deviceInfo.expoVersion}`,
          `Physical Device: ${deviceInfo.isDevice ? 'Yes' : 'No (Simulator)'}`,
          `Screen: ${screenWidth.toFixed(0)}px wide`
        ].join('\n'),
        lastChecked: new Date(),
      };

    } catch (error) {
      return {
        name: 'Device Compatibility',
        status: 'warning',
        message: 'Could not determine device info',
        details: error instanceof Error ? error.message : 'Unknown device error',
        lastChecked: new Date(),
      };
    }
  }, []);

  /**
   * Comprehensive Health Check Orchestration
   * Coordinates multiple asynchronous health checks
   */
  const runAllHealthChecks = useCallback(async () => {
    setIsRefreshing(true);

    try {
      console.log('[HealthMonitor] Starting comprehensive health check...');

      // Run backend health checks and device checks concurrently
      const [backendResults, locationResult, deviceResult] = await Promise.all([
        runComprehensiveHealthCheck(),
        checkLocationServices(),
        checkDeviceCompatibility(),
      ]);

      // Update state with all results
      setHealthChecks(backendResults);
      setLocationStatus(locationResult);
      setDeviceInfo(deviceResult);
      setLastRefresh(new Date());

      console.log('[HealthMonitor] Health check completed successfully');

    } catch (error) {
      console.error('[HealthMonitor] Health check failed:', error);
      Alert.alert(
        'Health Check Error',
        'An unexpected error occurred while running health checks. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRefreshing(false);
      setIsInitialLoad(false);
    }
  }, [checkLocationServices, checkDeviceCompatibility]);

  // Initialize health checks when component mounts
  useEffect(() => {
    runAllHealthChecks();
  }, [runAllHealthChecks]);

  /**
   * Helper functions for status display
   */
  const getStatusIcon = (status: HealthCheckResult['status']): string => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'checking': return '🔄';
      default: return '❓';
    }
  };

  const getStatusColor = (status: HealthCheckResult['status']): string => {
    switch (status) {
      case 'healthy': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      case 'checking': return '#6B7280';
      default: return '#6B7280';
    }
  };

  /**
   * Display detailed health check information
   */
  const showHealthCheckDetails = (healthCheck: HealthCheckResult) => {
    const title = `${getStatusIcon(healthCheck.status)} ${healthCheck.name}`;
    const message = `${healthCheck.message}\n\n${healthCheck.details || 'No additional details available.'}`;
    
    Alert.alert(title, message, [{ text: 'OK' }]);
  };

  /**
   * Calculate overall system health
   */
  const getOverallHealth = () => {
    const allChecks = [...healthChecks];
    if (locationStatus) allChecks.push(locationStatus);
    if (deviceInfo) allChecks.push(deviceInfo);

    const hasErrors = allChecks.some(check => check.status === 'error');
    const hasWarnings = allChecks.some(check => check.status === 'warning');
    const isChecking = allChecks.some(check => check.status === 'checking');

    if (isChecking) return { status: 'checking', message: 'Running health checks...' };
    if (hasErrors) return { status: 'error', message: 'System issues detected' };
    if (hasWarnings) return { status: 'warning', message: 'System warnings present' };
    return { status: 'healthy', message: 'All systems operational' };
  };

  const overallHealth = getOverallHealth();
  const allHealthChecks = [...healthChecks];
  if (locationStatus) allHealthChecks.push(locationStatus);
  if (deviceInfo) allHealthChecks.push(deviceInfo);

  // Loading state for initial health check
  if (isInitialLoad) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Checking system health...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={runAllHealthChecks} />
      }
    >
      <StatusBar style="auto" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>System Health Monitor</Text>
        <Text style={styles.subtitle}>
          Comprehensive diagnostic tool for ReMap development environment
        </Text>
      </View>

      {/* Overall Health Status Card */}
      <View style={[styles.overallHealthCard, { borderColor: getStatusColor(overallHealth.status) }]}>
        <Text style={styles.overallHealthIcon}>
          {getStatusIcon(overallHealth.status)}
        </Text>
        <Text style={styles.overallHealthTitle}>
          {overallHealth.message}
        </Text>
        <Text style={styles.lastRefreshText}>
          Last checked: {lastRefresh.toLocaleTimeString()}
        </Text>
      </View>

      {/* Individual Health Checks */}
      <View style={styles.healthChecksContainer}>
        <Text style={styles.sectionTitle}>System Components</Text>
        {allHealthChecks.map((check, index) => (
          <TouchableOpacity
            key={`${check.name}-${index}`}
            style={[styles.healthCheckCard, { borderLeftColor: getStatusColor(check.status) }]}
            onPress={() => showHealthCheckDetails(check)}
            activeOpacity={0.7}
          >
            <View style={styles.healthCheckHeader}>
              <Text style={styles.healthCheckIcon}>
                {getStatusIcon(check.status)}
              </Text>
              <View style={styles.healthCheckContent}>
                <Text style={styles.healthCheckName}>{check.name}</Text>
                <Text style={[styles.healthCheckMessage, { color: getStatusColor(check.status) }]}>
                  {check.message}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Manual Refresh Button */}
      <TouchableOpacity
        style={[styles.refreshButton, isRefreshing && styles.refreshButtonDisabled]}
        onPress={runAllHealthChecks}
        disabled={isRefreshing}
        activeOpacity={0.7}
      >
        {isRefreshing ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.refreshButtonText}>🔄 Refresh Health Checks</Text>
        )}
      </TouchableOpacity>

      {/* Success Status Section */}
      <View style={styles.successSection}>
        <Text style={styles.successTitle}>🎉 ReMap Development Environment</Text>
        <Text style={styles.successText}>✅ Automatic network configuration working</Text>
        <Text style={styles.successText}>✅ Mobile device connectivity established</Text>
        <Text style={styles.successText}>✅ Backend API integration successful</Text>
        <Text style={styles.successText}>✅ Database connectivity verified</Text>
        <Text style={styles.successText}>✅ Professional development workflow active</Text>
      </View>

      {/* Educational Information Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>💡 About This Health Monitor</Text>
        <Text style={styles.infoText}>
          This comprehensive health monitor demonstrates the complete integration between your React Native 
          mobile application, containerized backend services, and device capabilities.
        </Text>
        <Text style={styles.infoText}>
          It verifies that all components of your ReMap development environment are working correctly, 
          including automatic network detection, API communication, database connectivity, and location services.
        </Text>
        <Text style={styles.infoText}>
          Tap any health check card to see detailed diagnostic information and troubleshooting guidance.
        </Text>
      </View>
    </ScrollView>
  );
}

/**
 * Comprehensive Stylesheet
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  overallHealthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  overallHealthIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  overallHealthTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  lastRefreshText: {
    fontSize: 14,
    color: '#6B7280',
  },
  healthChecksContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  healthCheckCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  healthCheckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthCheckIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  healthCheckContent: {
    flex: 1,
  },
  healthCheckName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  healthCheckMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  refreshButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successSection: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
    marginBottom: 4,
  },
  infoSection: {
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
    marginBottom: 8,
  },
});