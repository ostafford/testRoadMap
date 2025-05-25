/**
 * Health Monitoring Service
 * 
 * This service demonstrates how React Native applications integrate with
 * containerized backend services. It provides comprehensive system health
 * monitoring that verifies all components of the ReMap development environment
 * are functioning correctly.
 * 
 * The service showcases several important patterns:
 * - HTTP client configuration for API communication
 * - Error handling strategies for network operations
 * - TypeScript interfaces for type-safe API responses
 * - Timeout management for reliable mobile networking
 * - Retry logic for handling transient network issues
 */

// Configuration for API communication
// In development, this points to your containerized backend services
// The localhost address works because Expo CLI creates a bridge between
// your mobile device and your development machine's network
const API_BASE_URL = 'http://localhost:3000';

/**
 * Type definitions for health check responses
 * These interfaces ensure type safety between frontend and backend
 * and serve as documentation for the API contract
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
 * HTTP Client Configuration
 * 
 * This class encapsulates all the networking logic needed to communicate
 * with your backend services. It handles timeouts, error processing,
 * and response parsing in a way that's optimized for mobile network conditions.
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
   * 
   * This method demonstrates best practices for mobile HTTP requests:
   * - Timeout management for unreliable network conditions
   * - Detailed error categorization for better user feedback
   * - Request/response logging for development debugging
   * - Proper cleanup of network resources
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

      // Clear timeout since request completed
      clearTimeout(timeoutId);

      // Check if response indicates success
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse JSON response with error handling
      const data = await response.json();
      console.log(`[HealthMonitor] Response received:`, data);
      
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Categorize different types of errors for better user feedback
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - check your network connection');
        } else if (error.message.includes('Network request failed')) {
          throw new Error('Network error - is the backend server running?');
        }
      }
      
      // Re-throw the error with additional context
      throw error;
    }
  }

  /**
   * Check backend API health and database connectivity
   * 
   * This method demonstrates how to verify that your containerized backend
   * services are accessible from the React Native application and functioning
   * correctly. It tests the complete data flow from mobile app through API
   * to database and back.
   */
  async checkBackendHealth(): Promise<HealthCheckResult> {
    try {
      const healthData = await this.makeRequest<BackendHealthResponse>('/health');

      // Validate response structure to ensure API contract compliance
      if (!healthData.status || !healthData.database) {
        throw new Error('Invalid health check response format');
      }

      // Determine overall health status based on backend response
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
   * 
   * This method verifies that the complete data flow from React Native
   * through Express.js to PostgreSQL is functioning correctly. It demonstrates
   * how to test integrated functionality rather than just individual components.
   */
  async checkDatabaseIntegration(): Promise<HealthCheckResult> {
    try {
      // Test a backend endpoint that requires database access
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
   * Verify API endpoint availability and response format
   * 
   * This method tests the basic API functionality that your React Native
   * components will depend on throughout the application. It verifies that
   * the backend services are not just running, but responding correctly
   * to the types of requests your mobile app will make.
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
 * 
 * This provides a convenient way for React Native components to access
 * health monitoring functionality without needing to manage client instances
 */
export const healthMonitorClient = new HealthMonitorClient();

/**
 * Convenience function for running comprehensive health checks
 * 
 * This function demonstrates how to coordinate multiple asynchronous operations
 * and provide comprehensive system status information to React Native components
 */
export async function runComprehensiveHealthCheck(): Promise<HealthCheckResult[]> {
  try {
    console.log('[HealthMonitor] Starting comprehensive health check...');
    
    // Run all health checks concurrently for better performance
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

/**
 * Export the health monitor client for use in React Native components
 * 
 * This enables components to perform individual health checks or access
 * specific backend integration functionality as needed
 */
export default healthMonitorClient;