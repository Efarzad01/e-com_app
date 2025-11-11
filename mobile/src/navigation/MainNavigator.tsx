import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '@/config/constants';

// Import Screens
import HomeScreen from '@/screens/home/HomeScreen';
import CategoriesScreen from '@/screens/categories/CategoriesScreen';
import CartScreen from '@/screens/cart/CartScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';

import ProductDetailScreen from '@/screens/products/ProductDetailScreen';
import ProductListScreen from '@/screens/products/ProductListScreen';
import SearchScreen from '@/screens/search/SearchScreen';
import CheckoutScreen from '@/screens/checkout/CheckoutScreen';
import OrdersScreen from '@/screens/orders/OrdersScreen';
import OrderDetailScreen from '@/screens/orders/OrderDetailScreen';
import WishlistScreen from '@/screens/wishlist/WishlistScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import AddressesScreen from '@/screens/addresses/AddressesScreen';
import AddEditAddressScreen from '@/screens/addresses/AddEditAddressScreen';
import PaymentScreen from '@/screens/payment/PaymentScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home Stack
const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="HomeMain"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ title: 'Product Details' }}
    />
    <Stack.Screen
      name="ProductList"
      component={ProductListScreen}
      options={{ title: 'Products' }}
    />
    <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
  </Stack.Navigator>
);

// Categories Stack
const CategoriesStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="CategoriesMain"
      component={CategoriesScreen}
      options={{ title: 'Categories' }}
    />
    <Stack.Screen
      name="ProductList"
      component={ProductListScreen}
      options={{ title: 'Products' }}
    />
    <Stack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ title: 'Product Details' }}
    />
  </Stack.Navigator>
);

// Cart Stack
const CartStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="CartMain" component={CartScreen} options={{ title: 'Cart' }} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
    <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
    <Stack.Screen name="Addresses" component={AddressesScreen} options={{ title: 'Addresses' }} />
    <Stack.Screen
      name="AddEditAddress"
      component={AddEditAddressScreen}
      options={{ title: 'Address' }}
    />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ProfileMain"
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
    <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'My Orders' }} />
    <Stack.Screen
      name="OrderDetail"
      component={OrderDetailScreen}
      options={{ title: 'Order Details' }}
    />
    <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ title: 'Wishlist' }} />
    <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    <Stack.Screen name="Addresses" component={AddressesScreen} options={{ title: 'Addresses' }} />
    <Stack.Screen
      name="AddEditAddress"
      component={AddEditAddressScreen}
      options={{ title: 'Address' }}
    />
  </Stack.Navigator>
);

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Categories') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Categories" component={CategoriesStack} />
      <Tab.Screen name="Cart" component={CartStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
