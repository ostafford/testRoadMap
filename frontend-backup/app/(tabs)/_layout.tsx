/**
 * Tab Navigation Layout
 * 
 * This component defines the main navigation structure for ReMap using a
 * tab-based interface that provides intuitive access to the core application
 * features. It demonstrates professional mobile navigation patterns and
 * integration with the overall application architecture.
 */

import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, useColorScheme } from 'react-native';

/**
 * Tab Bar Icon Component
 * 
 * This helper component creates consistent iconography across the tab navigation
 * and demonstrates how to create reusable UI components in React Native.
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

/**
 * Tab Layout Component
 * 
 * This component orchestrates the main navigation structure for ReMap,
 * creating an intuitive interface that enables users to easily access
 * different aspects of the memory atlas functionality.
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();

  // Define theme colors that adapt to system preferences
  const tintColor = colorScheme === 'dark' ? '#FFFFFF' : '#3B82F6';
  const backgroundColor = colorScheme === 'dark' ? '#1F2937' : '#FFFFFF';
  const inactiveTintColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        tabBarInactiveTintColor: inactiveTintColor,
        tabBarStyle: {
          backgroundColor: backgroundColor,
          borderTopColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
        },
        headerStyle: {
          backgroundColor: backgroundColor,
        },
        headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#1F2937',
      }}>
      
      {/* Memory Map Tab - Primary ReMap Interface */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Memory Map',
          tabBarIcon: ({ color }) => <TabBarIcon name="map-marker" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="plus-circle"
                    size={25}
                    color={tintColor}
                    style={{ 
                      marginRight: 15, 
                      opacity: pressed ? 0.5 : 1 
                    }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      
      {/* System Health Tab - Development and Diagnostic Tool */}
      <Tabs.Screen
        name="health"
        options={{
          title: 'System Health',
          tabBarIcon: ({ color }) => <TabBarIcon name="stethoscope" color={color} />,
          headerTitle: 'Development Health Monitor',
        }}
      />
      
      {/* Explore Tab - Memory Discovery Interface */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <TabBarIcon name="compass" color={color} />,
          headerTitle: 'Explore Memories',
        }}
      />
      
      {/* Profile Tab - User Settings and Account Management */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          headerTitle: 'Your Profile',
        }}
      />
    </Tabs>
  );
}