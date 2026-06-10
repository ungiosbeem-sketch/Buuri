import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StatusBar,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// ========================
// Ride Screen (Sida screenshot-ka)
// ========================
const RideScreen = () => {
  const [whereTo, setWhereTo] = useState('');

  // Taariikhda safarrada
  const tripHistory = [
    { id: '1', date: 'Aug 24, 7:10 PM', from: 'Zaporiz\'ke Hwy, 40', price: 'UAH 0.00', status: 'Canceled' },
    { id: '2', date: 'Aug 23, 7:03 PM', from: 'Zaporiz\'ke Hwy, 40', price: 'UAH 88.14', status: 'Completed' },
    { id: '3', date: 'Aug 20, 6:02 PM', from: 'Zaporiz\'ke Hwy, 40', price: 'UAH 109.26', status: 'Completed' },
    { id: '4', date: 'Aug 20, 3:48 PM', from: 'Mechnykova St, 19', price: 'UAH 113.75', status: 'Completed' },
    { id: '5', date: 'Aug 19, 9:15 AM', from: 'Zaporiz\'ke Hwy, 40', price: 'UAH 45.50', status: 'Completed' },
  ];

  const renderTripItem = ({ item }) => (
    <View style={styles.tripItem}>
      <View style={styles.tripLeft}>
        <Text style={styles.tripDate}>{item.date}</Text>
        <Text style={styles.tripFrom}>{item.from}</Text>
      </View>
      <View style={styles.tripRight}>
        <Text style={styles.tripPrice}>{item.price}</Text>
        {item.status === 'Canceled' && <Text style={styles.canceledBadge}>Canceled</Text>}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.screenContainer} showsVerticalScrollIndicator={false}>
      {/* Header: Hi there Stanislav Kashchishen */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi there</Text>
        <Text style={styles.name}>Stanislav Kashchishen</Text>
      </View>

      {/* Where to? input */}
      <View style={styles.whereToContainer}>
        <Ionicons name="search-outline" size={20} color="#666" />
        <TextInput
          style={styles.whereToInput}
          placeholder="Where to?"
          placeholderTextColor="#999"
          value={whereTo}
          onChangeText={setWhereTo}
        />
      </View>

      {/* Now + Addresses */}
      <View style={styles.nowContainer}>
        <Text style={styles.nowText}>Now</Text>
        <View style={styles.addressCard}>
          <Ionicons name="location-outline" size={20} color="#007AFF" />
          <Text style={styles.addressText}>Zaporiz'ke Hwy, 40</Text>
        </View>
        <View style={styles.addressCard}>
          <Ionicons name="navigate-outline" size={20} color="#34C759" />
          <Text style={styles.addressText}>Mechnykova St, 19</Text>
        </View>
      </View>

      {/* Activity / Past section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Activity</Text>
        <Text style={styles.pastLink}>Past</Text>
      </View>

      {/* Trip History List */}
      <FlatList
        data={tripHistory}
        renderItem={renderTripItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        style={styles.tripList}
      />

      {/* Links (Help, Wallet, Trips, Messages, Settings, Earn, Legal) */}
      <View style={styles.linksGrid}>
        <TouchableOpacity style={styles.linkItem}>
          <Ionicons name="help-circle-outline" size={28} color="#007AFF" />
          <Text style={styles.linkText}>Help</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkItem}>
          <Ionicons name="wallet-outline" size={28} color="#007AFF" />
          <Text style={styles.linkText}>Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkItem}>
          <Ionicons name="car-outline" size={28} color="#007AFF" />
          <Text style={styles.linkText}>Trips</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkItem}>
          <Ionicons name="chatbubble-outline" size={28} color="#007AFF" />
          <Text style={styles.linkText}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkItem}>
          <Ionicons name="settings-outline" size={28} color="#007AFF" />
          <Text style={styles.linkText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkItem}>
          <Ionicons name="car-sport-outline" size={28} color="#007AFF" />
          <Text style={styles.linkText}>Earn by driving or delivering</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.legalLink}>
        <Text style={styles.legalText}>Legal</Text>
      </TouchableOpacity>

      <Text style={styles.version}>v1.5.3.8 10003</Text>
    </ScrollView>
  );
};

// ========================
// Promo Screen
// ========================
const PromoScreen = () => (
  <View style={styles.placeholderContainer}>
    <Ionicons name="pricetag-outline" size={60} color="#ccc" />
    <Text style={styles.placeholderText}>Promos & Discounts</Text>
    <Text style={styles.subText}>No active promos at the moment</Text>
  </View>
);

// ========================
// Delivery Screen
// ========================
const DeliveryScreen = () => (
  <View style={styles.placeholderContainer}>
    <Ionicons name="cube-outline" size={60} color="#ccc" />
    <Text style={styles.placeholderText}>Food & Package Delivery</Text>
    <Text style={styles.subText}>Track your deliveries here</Text>
  </View>
);

// ========================
// Travel Screen
// ========================
const TravelScreen = () => (
  <View style={styles.placeholderContainer}>
    <Ionicons name="airplane-outline" size={60} color="#ccc" />
    <Text style={styles.placeholderText}>Travel & Intercity</Text>
    <Text style={styles.subText}>Book rides to other cities</Text>
  </View>
);

// ========================
// Food Screen
// ========================
const FoodScreen = () => (
  <View style={styles.placeholderContainer}>
    <Ionicons name="restaurant-outline" size={60} color="#ccc" />
    <Text style={styles.placeholderText}>Food Delivery</Text>
    <Text style={styles.subText}>Order from nearby restaurants</Text>
  </View>
);

// ========================
// Bottom Tab Navigator
// ========================
const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.safeArea}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Ride') iconName = focused ? 'car' : 'car-outline';
              else if (route.name === 'Promo') iconName = focused ? 'pricetag' : 'pricetag-outline';
              else if (route.name === 'Delivery') iconName = focused ? 'cube' : 'cube-outline';
              else if (route.name === 'Travel') iconName = focused ? 'airplane' : 'airplane-outline';
              else if (route.name === 'Food') iconName = focused ? 'fast-food' : 'fast-food-outline';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#8E8E93',
            tabBarStyle: styles.tabBar,
            headerShown: false,
          })}
        >
          <Tab.Screen name="Ride" component={RideScreen} />
          <Tab.Screen name="Promo" component={PromoScreen} />
          <Tab.Screen name="Delivery" component={DeliveryScreen} />
          <Tab.Screen name="Travel" component={TravelScreen} />
          <Tab.Screen name="Food" component={FoodScreen} />
        </Tab.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
};

// ========================
// Styles
// ========================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
  },
  name: {
    fontSize: 18,
    color: '#555',
    marginTop: 4,
  },
  whereToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  whereToInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#000',
  },
  nowContainer: {
    marginBottom: 24,
  },
  nowText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  addressText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#000',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  pastLink: {
    fontSize: 14,
    color: '#007AFF',
  },
  tripList: {
    marginBottom: 20,
  },
  tripItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFF4',
  },
  tripLeft: {
    flex: 2,
  },
  tripDate: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  tripFrom: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  tripRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  tripPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  canceledBadge: {
    fontSize: 10,
    color: '#FF3B30',
    marginTop: 4,
  },
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  linkItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  linkText: {
    fontSize: 12,
    marginTop: 6,
    color: '#007AFF',
    textAlign: 'center',
  },
  legalLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  legalText: {
    fontSize: 14,
    color: '#007AFF',
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: '#aaa',
    marginVertical: 16,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    color: '#333',
  },
  subText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  tabBar: {
    paddingBottom: 8,
    paddingTop: 8,
    height: 60,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
});

export default App;
