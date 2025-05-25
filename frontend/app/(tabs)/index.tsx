/**
 * Main Memory Map Screen - ReMap's Primary Interface
 * 
 * This component serves as the core interface for ReMap's location-based memory
 * atlas functionality. It demonstrates how React Native applications integrate
 * location services, API communication, and interactive user interfaces to
 * create compelling mobile experiences.
 * 
 * Key concepts demonstrated:
 * - Location services integration for memory mapping
 * - Real-time backend API communication
 * - Mobile-optimized user interface design
 * - State management for complex application data
 * - Integration between device capabilities and cloud services
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';

// Import backend integration service
import { healthMonitorClient } from '../services/health';

const { width, height } = Dimensions.get('window');

/**
 * Type definitions for memory-related data structures
 * These interfaces will evolve as ReMap's memory management features develop
 */
interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

interface MemoryPin {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  timestamp: Date;
  type: 'photo' | 'text' | 'audio';
  author: string;
}

/**
 * Main Memory Map Component
 * 
 * This component will eventually become the sophisticated interactive map
 * interface that makes ReMap unique. For now, it demonstrates the foundational
 * patterns and integration points that will support the full mapping experience.
 */
export default function MemoryMapScreen() {
  // State management for location and memory data
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationPermission, setLocationPermission] = useState<string>('unknown');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [memoryPins, setMemoryPins] = useState<MemoryPin[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  /**
   * Initialize Location Services
   * 
   * This function demonstrates comprehensive location service integration
   * that will be essential for ReMap's core functionality of location-based
   * memory creation and discovery.
   */
  const initializeLocation = useCallback(async () => {
    try {
      setIsLoadingLocation(true);

      // Check location service availability
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        Alert.alert(
          'Location Services Required',
          'ReMap needs location services enabled to create your interactive memory atlas. Please enable location services in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Request location permissions with clear explanation
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'ReMap needs location access to pin your memories to specific places and help you discover stories from your current location. You can grant permission in your device Settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current location with appropriate accuracy for memory mapping
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      setCurrentLocation(locationData);

      // Load memories for the current location area
      await loadMemoriesForLocation(locationData.latitude, locationData.longitude);

    } catch (error) {
      console.error('Location initialization error:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your device settings and location permissions, then try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  /**
   * Load Memories for Current Location
   * 
   * This function demonstrates how the frontend will communicate with your
   * backend API to retrieve location-based memory data. It shows the integration
   * pattern between React Native components and containerized backend services.
   */
  const loadMemoriesForLocation = useCallback(async (latitude: number, longitude: number) => {
    try {
      setIsLoadingMemories(true);

      // Test backend connectivity first
      const healthResult = await healthMonitorClient.checkBackendHealth();
      setBackendStatus(healthResult.status === 'healthy' ? 'connected' : 'disconnected');

      if (healthResult.status !== 'healthy') {
        console.warn('Backend not available for memory loading:', healthResult.message);
        // For development, create sample data to demonstrate the interface
        loadSampleMemories(latitude, longitude);
        return;
      }

      // TODO: Replace with actual API call when backend memory endpoints are implemented
      // const response = await fetch(`http://localhost:3000/api/memories?lat=${latitude}&lon=${longitude}&radius=1000`);
      // const memoriesData = await response.json();
      
      // For now, demonstrate with sample data that shows the intended functionality
      loadSampleMemories(latitude, longitude);

    } catch (error) {
      console.error('Error loading memories:', error);
      setBackendStatus('disconnected');
      // Fall back to sample data for development purposes
      loadSampleMemories(latitude, longitude);
    } finally {
      setIsLoadingMemories(false);
    }
  }, []);

  /**
   * Load Sample Memory Data
   * 
   * This function creates sample memories around the current location to
   * demonstrate the memory mapping interface and data structures that will
   * be used throughout ReMap development.
   */
  const loadSampleMemories = useCallback((latitude: number, longitude: number) => {
    const sampleMemories: MemoryPin[] = [
      {
        id: '1',
        latitude: latitude + 0.001,
        longitude: longitude + 0.001,
        title: 'Team Meeting Spot',
        description: 'First ReMap planning session - decided on containerized development approach',
        timestamp: new Date(Date.now() - 86400000), // Yesterday
        type: 'text',
        author: 'Development Team',
      },
      {
        id: '2',
        latitude: latitude - 0.002,
        longitude: longitude + 0.003,
        title: 'Coffee Shop Breakthrough',
        description: 'Where we figured out the hybrid frontend/backend architecture',
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        type: 'photo',
        author: 'Anna & Okky',
      },
      {
        id: '3',
        latitude: latitude + 0.003,
        longitude: longitude - 0.001,
        title: 'Docker Success Celebration',
        description: 'Successfully got cross-platform development environment working!',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        type: 'text',
        author: 'Nigel',
      },
    ];

    setMemoryPins(sampleMemories);
  }, []);

  /**
   * Create New Memory
   * 
   * This function demonstrates the memory creation workflow that will be
   * central to the ReMap user experience. It shows how location data and
   * user input combine to create location-based memories.
   */
  const createNewMemory = useCallback(() => {
    if (!currentLocation) {
      Alert.alert(
        'Location Required',
        'Please enable location services to create location-based memories.',
        [{ text: 'OK', onPress: initializeLocation }]
      );
      return;
    }

    // TODO: Navigate to memory creation screen
    Alert.alert(
      'Create Memory',
      `This will create a new memory at your current location:\n\nLatitude: ${currentLocation.latitude.toFixed(6)}\nLongitude: ${currentLocation.longitude.toFixed(6)}\n\nIn the full ReMap app, this will open an intuitive memory creation interface with camera integration, text input, and audio recording capabilities.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create', 
          onPress: () => {
            console.log('Memory creation flow would start here');
            // Future: Navigate to memory creation screen
          }
        }
      ]
    );
  }, [currentLocation, initializeLocation]);

  /**
   * View Memory Details
   * 
   * This function demonstrates how users will interact with existing memories
   * in the full ReMap application, showing detailed information and enabling
   * social interaction features.
   */
  const viewMemoryDetails = useCallback((memory: MemoryPin) => {
    Alert.alert(
      memory.title,
      `${memory.description}\n\nCreated by: ${memory.author}\nLocation: ${memory.latitude.toFixed(6)}, ${memory.longitude.toFixed(6)}\nDate: ${memory.timestamp.toLocaleDateString()}\nType: ${memory.type}`,
      [{ text: 'OK' }]
    );
  }, []);

  /**
   * Test Backend Connection
   * 
   * This function provides a quick way to verify backend connectivity
   * and demonstrate the health monitoring integration within the main interface.
   */
  const testBackendConnection = useCallback(async () => {
    try {
      const healthResult = await healthMonitorClient.checkBackendHealth();
      setBackendStatus(healthResult.status === 'healthy' ? 'connected' : 'disconnected');
      
      Alert.alert(
        'Backend Status',
        `Status: ${healthResult.status}\n${healthResult.message}\n\n${healthResult.details || ''}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      setBackendStatus('disconnected');
      Alert.alert(
        'Connection Test Failed',
        'Unable to connect to backend services. Make sure your Docker containers are running.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  // Initialize location services when component mounts
  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StatusBar style="auto" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Memory Atlas</Text>
        <Text style={styles.subtitle}>
          Your interactive map of experiences and stories
        </Text>
      </View>

      {/* Backend Connection Status */}
      <TouchableOpacity 
        style={[styles.statusCard, { borderColor: getStatusColor(backendStatus) }]}
        onPress={testBackendConnection}
        activeOpacity={0.7}
      >
        <Text style={styles.statusTitle}>Backend Connection</Text>
        <Text style={[styles.statusText, { color: getStatusColor(backendStatus) }]}>
          {backendStatus === 'connected' ? '✅ Connected' : 
           backendStatus === 'disconnected' ? '❌ Disconnected' : '❓ Unknown'}
        </Text>
        <Text style={styles.statusHint}>Tap to test connection</Text>
      </TouchableOpacity>

      {/* Location Status Card */}
      <View style={styles.locationCard}>
        <Text style={styles.cardTitle}>📍 Current Location</Text>
        {isLoadingLocation ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        ) : currentLocation ? (
          <View>
            <Text style={styles.locationText}>
              Latitude: {currentLocation.latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Longitude: {currentLocation.longitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Accuracy: ±{Math.round(currentLocation.accuracy || 0)}m
            </Text>
          </View>
        ) : (
          <TouchableOpacity onPress={initializeLocation} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>📍 Get Location</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Interactive Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderTitle}>🗺️ Interactive Memory Map</Text>
        <Text style={styles.mapPlaceholderText}>
          This area will contain the interactive memory map where users can:
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.featureText}>• View memory pins at specific locations</Text>
          <Text style={styles.featureText}>• Tap pins to see memory details and stories</Text>
          <Text style={styles.featureText}>• Create new memories at current location</Text>
          <Text style={styles.featureText}>• Explore memories from other users nearby</Text>
          <Text style={styles.featureText}>• Filter by memory type, date, or distance</Text>
        </View>
      </View>

      {/* Create Memory Button */}
      <TouchableOpacity 
        style={[styles.createButton, !currentLocation && styles.createButtonDisabled]}
        onPress={createNewMemory}
        disabled={!currentLocation}
        activeOpacity={0.7}
      >
        <Text style={styles.createButtonText}>
          {currentLocation ? '📌 Create Memory Here' : '📍 Location Required'}
        </Text>
      </TouchableOpacity>

      {/* Nearby Memories Section */}
      <View style={styles.memoriesSection}>
        <View style={styles.memoriesSectionHeader}>
          <Text style={styles.sectionTitle}>💭 Nearby Memories</Text>
          {isLoadingMemories && <ActivityIndicator size="small" color="#6B7280" />}
        </View>
        
        {memoryPins.length > 0 ? (
          memoryPins.map((memory) => (
            <TouchableOpacity
              key={memory.id}
              style={styles.memoryCard}
              onPress={() => viewMemoryDetails(memory)}
              activeOpacity={0.7}
            >
              <View style={styles.memoryHeader}>
                <Text style={styles.memoryIcon}>
                  {memory.type === 'photo' ? '📷' : memory.type === 'audio' ? '🎵' : '📝'}
                </Text>
                <View style={styles.memoryContent}>
                  <Text style={styles.memoryTitle}>{memory.title}</Text>
                  <Text style={styles.memoryDescription} numberOfLines={2}>
                    {memory.description}
                  </Text>
                  <Text style={styles.memoryAuthor}>by {memory.author}</Text>
                  <Text style={styles.memoryTimestamp}>
                    {memory.timestamp.toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyMemories}>
            <Text style={styles.emptyMemoriesText}>
              No memories found in this area yet. Be the first to create one!
            </Text>
          </View>
        )}
      </View>

      {/* Development Information */}
      <View style={styles.devInfo}>
        <Text style={styles.devInfoTitle}>🔧 Development Preview</Text>
        <Text style={styles.devInfoText}>
          This screen demonstrates the foundation for ReMap's core memory mapping interface. 
          The actual interactive map will use React Native Maps or similar mapping library, 
          with real-time memory pin rendering, smooth map interactions, and comprehensive 
          memory management features.
        </Text>
        <Text style={styles.devInfoText}>
          The backend integration shown here will expand to support user authentication, 
          memory creation workflows, social features, and offline synchronization capabilities.
        </Text>
      </View>
    </ScrollView>
  );
}

/**
 * Helper function for status color coding
 */
function getStatusColor(status: 'connected' | 'disconnected' | 'unknown'): string {
  switch (status) {
    case 'connected': return '#10B981';
    case 'disconnected': return '#EF4444';
    case 'unknown': return '#6B7280';
    default: return '#6B7280';
  }
}

/**
 * Comprehensive Stylesheet
 * 
 * These styles demonstrate React Native styling patterns that create
 * professional, responsive mobile interfaces optimized for the ReMap
 * user experience across different device sizes and orientations.
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
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  statusHint: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  locationText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mapPlaceholder: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  mapPlaceholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B5563',
    marginBottom: 12,
    textAlign: 'center',
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  featureList: {
    alignSelf: 'stretch',
  },
  featureText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'left',
  },
  createButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  memoriesSection: {
    marginBottom: 24,
  },
  memoriesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  memoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  memoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  memoryContent: {
    flex: 1,
  },
  memoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  memoryDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 6,
  },
  memoryAuthor: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
    marginBottom: 2,
  },
  memoryTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyMemories: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  emptyMemoriesText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  devInfo: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  devInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  devInfoText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
    marginBottom: 8,
  },
});
