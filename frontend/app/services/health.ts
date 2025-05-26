/**
 * Health Monitoring Service
 * 
 * This service demonstrates how React Native applications integrate with
 * containerized backend services. It provides comprehensive system health
 * monitoring that verifies all components of the ReMap development environment
 * are functioning correctly.
 */

// Configuration for API communication - Dynamic IP Detection
// This automatically detects the correct IP address for mobile device connections

const getApiBaseUrl = (): string => {
    // In React Native, we can access Expo's debugging information
    // The Metro bundler URL contains the correct IP address
    if (typeof global !== 'undefined' && global.__DEV__) {
      try {
        // Try to extract IP from Metro's source maps URL or other debugging info
        // This is a common pattern in React Native development
        const metroUrl = global.__METRO_ORIGIN__;
        if (metroUrl) {
          const url = new URL(metroUrl);
          return `http://${url.hostname}:3000`;
        }
      } catch (error) {
        console.log('[HealthService] Could not extract IP from Metro URL:', error);
      }
    }
  
    // Fallback: Try to detect from the current networking context
    // In Expo managed workflow, we can sometimes access this information
    if (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost') {
      return `http://${window.location.hostname}:3000`;
    }
  
    // Final fallback - this will need to be manually configured
    console.warn('[HealthService] Using localhost fallback - mobile devices may not connect');
    return 'http://localhost:3000';
  };
  
  const API_BASE_URL = getApiBaseUrl();
  
  // Log the detected URL for debugging
  console.log('[HealthService] Using API Base URL:', API_BASE_URL);
  

/**
 * Type definitions for health check responses
 * These interfaces ensure type safety between frontend and backend
 */
export interface BackendHealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  environment: string;
  database: {
    connected: boolean;
    current_time: string;
    version: string;
  };
  uptime: number;
}

export interface HealthCheckResult {
  name: string;
  status: 'checking' | 'healthy' | 'warning' | 'error';
  message: string;
  details?: string;
  lastChecked?: Date;
}

/**
 * HTTP Client for Backend Communication
 */
class HealthMonitorClient {
  private readonly baseUrl: string;
  private readonly defaultTimeout: number;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = 10000) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = timeout;
  }

  /**
   * Generic HTTP request method with comprehensive error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = this.defaultTimeout
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Create abort controller for timeout management
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log(`[HealthMonitor] Making request to: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[HealthMonitor] Response received:`, data);
      
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - check your network connection');
        } else if (error.message.includes('Network request failed')) {
          throw new Error('Network error - is the backend server running?');
        }
      }
      
      throw error;
    }
  }

  /**
   * Check backend API health and database connectivity
   */
  async checkBackendHealth(): Promise<HealthCheckResult> {
    try {
      const healthData = await this.makeRequest<BackendHealthResponse>('/health');

      if (!healthData.status || !healthData.database) {
        throw new Error('Invalid health check response format');
      }

      const isHealthy = healthData.status === 'healthy' && healthData.database.connected;

      return {
        name: 'Backend API Connection',
        status: isHealthy ? 'healthy' : 'warning',
        message: isHealthy 
          ? `Connected to ${healthData.environment} environment`
          : 'Backend reported issues',
        details: [
          `Server uptime: ${Math.round(healthData.uptime / 60)} minutes`,
          `Database: ${healthData.database.version}`,
          `Environment: ${healthData.environment}`,
          `Last checked: ${healthData.timestamp}`
        ].join('\n'),
        lastChecked: new Date(),
      };

    } catch (error) {
      return this.createErrorResult(
        'Backend API Connection',
        error instanceof Error ? error.message : 'Unknown error',
        this.getErrorDetails(error)
      );
    }
  }

  /**
   * Test database integration through backend API
   */
  async checkDatabaseIntegration(): Promise<HealthCheckResult> {
    try {
      const response = await this.makeRequest('/api/memories');

      return {
        name: 'Database Integration',
        status: 'healthy',
        message: 'Database queries working correctly',
        details: 'Sample endpoint response received\nReady for memory storage implementation',
        lastChecked: new Date(),
      };

    } catch (error) {
      return this.createErrorResult(
        'Database Integration',
        'Database query failed',
        error instanceof Error ? error.message : 'Unknown database error'
      );
    }
  }

  /**
   * Verify API endpoint availability
   */
  async checkApiEndpoints(): Promise<HealthCheckResult> {
    try {
      const response = await this.makeRequest('/api');

      return {
        name: 'API Endpoints',
        status: 'healthy',
        message: 'API endpoints responding correctly',
        details: 'Core API structure verified\nReady for feature development',
        lastChecked: new Date(),
      };

    } catch (error) {
      return this.createErrorResult(
        'API Endpoints',
        'API endpoint test failed',
        error instanceof Error ? error.message : 'Unknown API error'
      );
    }
  }

  /**
   * Helper method to create consistent error result objects
   */
  private createErrorResult(
    name: string,
    message: string,
    details: string
  ): HealthCheckResult {
    return {
      name,
      status: 'error',
      message,
      details,
      lastChecked: new Date(),
    };
  }

  /**
   * Generate detailed error information for troubleshooting
   */
  private getErrorDetails(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return 'The backend server took too long to respond. This might indicate network issues or server problems.';
      } else if (error.message.includes('Network request failed')) {
        return `Make sure your Docker containers are running with: docker-compose up\nBackend should be available at: ${this.baseUrl}`;
      } else {
        return 'Check the backend server logs for more details about this error.';
      }
    }
    return 'An unexpected error occurred during the health check.';
  }
}

/**
 * Singleton instance of the health monitor client
 */
export const healthMonitorClient = new HealthMonitorClient();

/**
 * Convenience function for running comprehensive health checks
 */
export async function runComprehensiveHealthCheck(): Promise<HealthCheckResult[]> {
  try {
    console.log('[HealthMonitor] Starting comprehensive health check...');
    
    const [backendCheck, databaseCheck, apiCheck] = await Promise.all([
      healthMonitorClient.checkBackendHealth(),
      healthMonitorClient.checkDatabaseIntegration(),
      healthMonitorClient.checkApiEndpoints(),
    ]);

    console.log('[HealthMonitor] Health check completed successfully');
    return [backendCheck, databaseCheck, apiCheck];

  } catch (error) {
    console.error('[HealthMonitor] Health check failed:', error);
    throw new Error('Failed to complete comprehensive health check');
  }
}

export default healthMonitorClient;